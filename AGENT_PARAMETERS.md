# Accessing URL Parameters in LiveKit Agent

## From the Frontend

When you visit the app with URL parameters:
```
http://localhost:3000?agent_name=ali&custom_param=test
```

These parameters are sent to your LiveKit agent in two ways:

## 1. From Participant Metadata

In your LiveKit agent (Python), access the participant metadata:

```python
from livekit import rtc

@ctx.on("participant_connected")
async def on_participant_connected(participant: rtc.RemoteParticipant):
    # Get metadata as JSON string
    metadata = participant.metadata
    
    if metadata:
        import json
        params = json.loads(metadata)
        agent_name = params.get('agent_name')
        custom_param = params.get('custom_param')
        
        print(f"Agent Name: {agent_name}")
        print(f"Custom Param: {custom_param}")
```

## 2. From Token Attributes

Access token attributes when the participant joins:

```python
from livekit.agents import JobContext

async def entrypoint(ctx: JobContext):
    # Access participant attributes from the token
    participant = await ctx.wait_for_participant()
    
    # Attributes are available on the participant object
    print(f"Participant attributes: {participant.attributes}")
    
    # Access specific attributes
    agent_name = participant.attributes.get('agent_name', 'default')
    custom_param = participant.attributes.get('custom_param', '')
    
    print(f"Agent Name: {agent_name}")
    print(f"Custom Param: {custom_param}")
```

## Example Use Cases

- Pass user IDs: `?user_id=12345`
- Set agent personality: `?personality=friendly`
- Configure language: `?language=es`
- Pass session context: `?session_id=abc123`
- Enable features: `?enable_video=true`

All parameters from the URL will be available in your agent!
