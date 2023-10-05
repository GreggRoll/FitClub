import openai
import json
import os
import yaml

# Load secret key from config.yml
with open("config.yml", 'r') as ymlfile:
    cfg = yaml.safe_load(ymlfile)

openai.api_key = cfg['openai_secret_key']

def read_user_data(user_id):
    with open('user_data.json', 'r') as f:
        user_data = json.load(f)
    return user_data.get(str(user_id), {})

def write_user_data(user_id, user_specific_data):
    with open('user_data.json', 'r') as f:
        user_data = json.load(f)
    user_data[str(user_id)] = user_specific_data
    with open('user_data.json', 'w') as f:
        json.dump(user_data, f, indent=4)

def interact_with_openai(user_query, user_id):
    user_specific_data = read_user_data(user_id)
    
    # Call OpenAI API with user_query and user_specific_data as context
    response = openai.Completion.create(
        engine="gpt-3.5-turbo",
        prompt=f"{user_specific_data}\n{user_query}",
        temperature=0.6,
        max_tokens=150
    )
    
    # Extract the response and update user_data if needed
    message = response.choices[0].text.strip()
    
    # You can update user_specific_data based on the response or other logic as needed
    # For example:
    # user_specific_data['last_interaction'] = message
    
    # Write the updated user-specific data back to user_data.json
    write_user_data(user_id, user_specific_data)
    
    return message


def update_user_data(user_id, new_data):
    user_specific_data = read_user_data(user_id)
    user_specific_data.update(new_data)
    write_user_data(user_id, user_specific_data)
