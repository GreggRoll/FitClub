from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_socketio import SocketIO
from openaiScripts import interact_with_openai
import datetime as dt
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app)

#remove for production
@app.after_request
def add_header(response):
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control'] = 'no-store'
    return response

# Load and save user data functions
def load_users():
    with open('user_data.json', 'r') as f:
        return json.load(f)

def save_users(users):
    with open('user_data.json', 'w') as f:
        json.dump(users, f)

# Routes
@app.route('/')
def index():
    if 'username' in session:
        username = session['username']
        users = load_users()
        user_data = users.get(username, {})
        return render_template('index.html', user_data=user_data)
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username in users and users[username]['password'] == password:
            session['username'] = username
            return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username not in users:
            users[username] = {
                'password': password,
                'user_name': username,
                'name': '',
                'current' : {
                    'current': dt.now(),
                    'height': '',
                    'weight': '',
                    'dl_max': '',
                    'squat_max': '',
                    'bench_max': '',
                },
                'chat_history': []
            }
            save_users(users)
            session['username'] = username
            return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/my_profile', methods=['GET', 'POST'])
def my_profile():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    users = load_users()  # Load the users
    user_data = users.get(username, {})
    
    if request.method == 'POST':
        user_data['name'] = request.form.get('name', user_data.get('name', ''))
        user_data['current']['height'] = request.form.get('height', user_data.get('current', {}).get('height', ''))
        user_data['current']['weight'] = request.form.get('weight', user_data.get('current', {}).get('weight', ''))
        user_data['current']['dl_max'] = request.form.get('dl_max', user_data.get('current', {}).get('dl_max', ''))
        user_data['current']['squat_max'] = request.form.get('squat_max', user_data.get('current', {}).get('squat_max', ''))
        user_data['current']['bench_max'] = request.form.get('bench_max', user_data.get('current', {}).get('bench_max', ''))
        
        # Append the current state to past and update the 'updated_date'
        print(dt)
        user_data['past'].append(dict(user_data['current']))
        user_data['current']['updated_date'] = dt.datetime.now().strftime('%m/%d/%Y')
        
        # Save the updated user data
        users[username] = user_data  # Update the user data in the users dictionary
        save_users(users)  # Save the updated users dictionary back to the file
        
    return render_template('my_profile.html', 
        username=username, 
        name=user_data.get('name', ''), 
        height=user_data.get('current', {}).get('height', ''),
        weight=user_data.get('current', {}).get('weight', ''),
        dl_max=user_data.get('current', {}).get('dl_max', ''),
        squat_max=user_data.get('current', {}).get('squat_max', ''),
        bench_max=user_data.get('current', {}).get('bench_max', '')
    )

@app.route('/my_workouts')
def my_workouts():
    if 'username' in session:
        username = session['username']
        users = load_users()
        workouts = users[username].get('workouts', [])
        return render_template('my_workouts.html', workouts=workouts)
    return redirect(url_for('login'))

@app.route('/get_workouts/<string:day>')
def get_workouts(day):
    username = session.get('username')
    if not username:
        return jsonify(error='User not logged in'), 401  # 401 Unauthorized
    
    with open('user_data.json', 'r') as f:
        users = json.load(f)
        
    user = users.get(username)
    if not user:
        return jsonify(error='User data not found'), 404  # 404 Not Found
        
    workouts = user.get('my_workouts', {}).get(day, {})
    return jsonify(workouts)

@app.route('/get_messages')
def get_messages():
    username = session.get('username')
    if not username:
        return jsonify(error='User not logged in'), 401  # 401 Unauthorized

    users = load_users()
    user = users.get(username)
    if not user:
        return jsonify(error='User data not found'), 404  # 404 Not Found

    chat_history = user.get('chat_history', [])
    return jsonify(chat_history)

@app.route('/exercise.html')
def exercise_page():
    try:
        return render_template('exercise.html')
    except:
        return "Placeholder content for exercise.html"

@socketio.on('message')
def handle_message(message):
    if 'username' in session:
        username = session['username']
        users = load_users()
        user_data = users.get(username, {})
        
        # Save user's message
        user_data['chat_history'].append({"user": message})
        
        # Get OpenAI response
        ai_response = interact_with_openai(message, username)
        user_data['chat_history'].append({"ai": ai_response})

        # Save to user_data.json
        save_users(users)
        
        # Emit both user's message and AI's response
        socketio.emit('user_message', message)
        socketio.emit('ai_message', ai_response)

@app.route('/save_workout', methods=['POST'])
def save_workout():
    if 'username' in session:
        username = session['username']
        workout = request.form['workout']
        users = load_users()
        users[username]['workouts'].append(workout)
        save_users(users)
        return redirect(url_for('my_workouts'))
    return redirect(url_for('login'))

if __name__ == '__main__':
    socketio.run(app)
