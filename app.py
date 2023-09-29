from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_socketio import SocketIO
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app)

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
                'height': '',
                'weight': '',
                'dl_max': '',
                'squat_max': '',
                'bench_max': '',
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
        user_data['height'] = request.form.get('height', user_data.get('height', ''))
        user_data['weight'] = request.form.get('weight', user_data.get('weight', ''))
        # Save the updated user data
        users[username] = user_data  # Update the user data in the users dictionary
        save_users(users)  # Save the updated users dictionary back to the file
        
    return render_template('my_profile.html', 
                           username=username, 
                           name=user_data.get('name', ''), 
                           height=user_data.get('height', ''), 
                           weight=user_data.get('weight', ''))
                           # ... (other user data fields)

@app.route('/my_workouts')
def my_workouts():
    if 'username' in session:
        username = session['username']
        users = load_users()
        workouts = users[username].get('workouts', [])
        return render_template('my_workouts.html', workouts=workouts)
    return redirect(url_for('login'))

@socketio.on('message')
def handle_message(message):
    if 'username' in session:
        username = session['username']
        users = load_users()
        user_data = users.get(username, {})
        user_data['chat_history'].append({"user": message})
        save_users(users)
        # Here, you can call OpenAI API to generate workout plans based on the message
        # Emit the message back along with Save Workout button
        socketio.emit('message', message)

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
    socketio.run(app, debug=False)
