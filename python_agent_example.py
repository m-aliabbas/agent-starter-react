import logging
import os
import re
from typing import Annotated
import json

import aiohttp
from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.pipeline import AgentCallContext, VoicePipelineAgent
from livekit.plugins import deepgram, openai, silero
import random
load_dotenv(dotenv_path=".property.env")
import asyncio
logger = logging.getLogger("demo")
logger.setLevel(logging.INFO)

# ============================================================================
# PORTAL CONFIGURATION
# ============================================================================
PORTAL_AGENT_ID = "3133ee2a-7636-4fb1-af95-8d8c89ac01a1"
PORTAL_API_URL = "http://144.76.220.24:8009"


async def get_agent_info(agent_id: str, api_url: str) -> dict:
    """Get agent info (prompt, welcome_message) from the Portal API."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{api_url}/agent/{agent_id}") as response:
                data = await response.json()
                return {
                    "prompt": data.get("prompt", ""),
                    "welcome_message": data.get("welcome_message", ""),
                }
    except Exception as e:
        logger.error(f"Error fetching agent info from portal: {e}")
        raise


class AssistantFnc(llm.FunctionContext):
    """
    The class defines a set of LLM functions that the assistant can execute.
    """

    def __init__(self, room_id='', url_params=None):
        super().__init__()
        self.room_id = room_id
        self.url_params = url_params or {}
    
    @llm.ai_callable()
    async def query_information(
        self,
        query: Annotated[
            str, llm.TypeInfo(description="User query for retrieving information related to perfumes or fragrance data from the retrieval system")
        ],
    ):
        """
        Quries the perfume system for user requests. Searches and retrieves information based on the provided query.
        Do not use ** or any markdown formating in response. Just plain results reterived by tools.
        """
        logger.debug(f"query_information function called with query: {query}")

        
        call_ctx = AgentCallContext.get_current()

        print("Room Id", self.room_id)
        print("URL Params", self.url_params)
        
        # Access specific URL parameters
        agent_name = self.url_params.get('agent_name', 'default')
        print(f"Agent Name from URL: {agent_name}")
        
        # List of possible messages to send
        messages = [
            f"Searching for information related to: '{query}'. This may take a moment.",
            "Hang tight! Gathering insights for your query...",
            "One moment, we're retrieving the best information for you.",
            "Please wait while we compile the relevant data...",
            f"Working on '{query}', this won't take long!",
            "Searching for answers... almost there!",
            f"Hold on, fetching details for '{query}'...",
            "Great question! Let me look that up for you.",
            "We're on it! Scanning for the most accurate information.",
            f"Sit tight, pulling data for '{query}'.",
            "Just a second, we're checking all the sources.",
            "Gathering the details... this should only take a moment!",
            "Your query is being processed. Thanks for your patience!",
            f"Scanning the database for '{query}'...",
            "Crunching the numbers... please bear with us!",
            "We're diving into the archives for this one—hang tight!",
            "Fetching the most relevant insights for your question...",
            "Processing your request... almost ready!",
            "Analyzing the data... we'll have your answer shortly.",
            "Searching high and low for the best response—just a sec!",
            "Your query is important to us. Results loading now!"
        ]

        random_choice = random.choice(messages)
        # Send the message to the user
        await call_ctx.agent.say(random_choice, add_to_chat_ctx=True)

        headers = {
            "Content-Type": "application/json",
        }
        
        url = "http://localhost:4091/search"

        payload = {
            "query": query,
            "top_k": 5,
            "per_head": 30,
            "max_queries": 3,
            "include_original": True
        }

        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        response_data = await response.json()

                        if "generated_text" in response_data:
                            print("Response Data:", response_data["generated_text"])
                            return response_data["generated_text"]
                        else:
                            return "The response format from the system was unexpected."
                    else:
                        return f"Failed to query the system, status code: {response.status}, reason: {response.reason}"
        except Exception as e:
            logger.error("query_information function encountered an error: %s", e)
            return f"I'm sorry, I encountered an error while querying the system: {str(e)}"
        
    
def prewarm_process(proc: JobProcess):
    # preload silero VAD in memory to speed up session start
    proc.userdata["vad"] = silero.VAD.load()


FALLBACK_PROMPT = """
You are a voice-based rental guidance assistant for tenants in the UK.
[... rest of prompt ...]
"""

FALLBACK_WELCOME_MESSAGE = "Hello! I'm Mildred, your rental guidance assistant. How can I assist you with evaluating your rental property today?"


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # ========================================================================
    # WAIT FOR PARTICIPANT AND EXTRACT URL PARAMETERS
    # ========================================================================
    participant = await ctx.wait_for_participant()
    
    # Extract URL parameters from participant metadata
    url_params = {}
    if participant.metadata:
        try:
            url_params = json.loads(participant.metadata)
            logger.info(f"✅ URL Parameters received: {url_params}")
        except json.JSONDecodeError:
            logger.warning(f"Could not parse participant metadata as JSON: {participant.metadata}")
    else:
        logger.warning("No participant metadata found")
    
    # Access specific parameters
    agent_name = url_params.get('agent_name', 'default')
    logger.info(f"Agent Name: {agent_name}")
    
    # You can also access participant attributes if they were set
    if hasattr(participant, 'attributes') and participant.attributes:
        logger.info(f"Participant Attributes: {participant.attributes}")

    # ========================================================================
    # FETCH PROMPT & WELCOME MESSAGE FROM PORTAL
    # ========================================================================
    prompt_text = FALLBACK_PROMPT
    welcome_message = FALLBACK_WELCOME_MESSAGE

    try:
        logger.info(f"Fetching agent config from portal (agent_id={PORTAL_AGENT_ID})")
        agent_info = await get_agent_info(PORTAL_AGENT_ID, PORTAL_API_URL)
        portal_prompt = agent_info.get("prompt", "")
        portal_welcome = agent_info.get("welcome_message", "")
        
        if portal_prompt:
            prompt_text = portal_prompt
            logger.info("Using prompt from portal")
        else:
            logger.warning("Portal returned empty prompt, using fallback")

        if portal_welcome:
            welcome_message = portal_welcome
            logger.info("Using welcome message from portal")
        else:
            logger.warning("Portal returned empty welcome message, using fallback")

    except Exception as e:
        logger.error(f"Failed to fetch from portal: {e}. Using fallback prompt and welcome message.")

    logger.info(f"=== WELCOME MESSAGE ===\n{welcome_message}")
    logger.info(f"=== PROMPT ===\n{prompt_text}")

    # ========================================================================
    # BUILD AGENT WITH URL PARAMETERS
    # ========================================================================
    initial_chat_ctx = llm.ChatContext().append(
        text=prompt_text,
        role="system",
    )
    
    # Pass URL parameters to function context
    fnc_ctx = AssistantFnc(room_id=ctx.room.name, url_params=url_params)
    
    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(),
        fnc_ctx=fnc_ctx,  # Pass the function context with URL params
        chat_ctx=initial_chat_ctx,
    )


    @agent.on("function_calls_collected")
    def on_function_calls_collected(fnc_calls):
        logger.info(f"function calls collected: {fnc_calls}")

    @agent.on("function_calls_finished")
    def on_function_calls_finished(fnc_calls):
        logger.info(f"function calls finished: {fnc_calls}")

    # Start the assistant. This will automatically publish a microphone track and listen to the participant.
    agent.start(ctx.room, participant)

    # Customize welcome message based on URL parameters
    if agent_name and agent_name != 'default':
        personalized_welcome = f"Hello {agent_name}! {welcome_message}"
        await agent.say(personalized_welcome, add_to_chat_ctx=True)
    else:
        await agent.say(welcome_message, add_to_chat_ctx=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm_process,
        ),
    )
