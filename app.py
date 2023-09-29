from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_socketio import SocketIO
import json
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
socketio = SocketIO(app)

# List to hold the messages
message_history = []
users = {}

def load_users():
    global users
    with open('user_data.json', 'r') as f:
        users = json.load(f)

def save_users():
    with open('user_data.json', 'w') as f:
        json.dump(users, f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_messages')
def get_messages():
    # Return the message history as JSON
    return jsonify(message_history)

@app.route('/send_message', methods=['POST'])
def send_message():
    message = request.form.get('message')
    # Append the new message to the history
    message_history.append(message)
    return '', 204  # Return no content


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username]['password'] == password:
            session['username'] = username
            return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username not in users:
            users[username] = {'password': password, 'workouts': []}
            save_users()
            session['username'] = username
            return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/my_workouts')
def my_workouts():
    if 'username' in session:
        username = session['username']
        workouts = users[username]['workouts']
        return render_template('my_workouts.html', workouts=workouts)
    return redirect(url_for('login'))

@socketio.on('message')
def handle_message(message):
    # Here, you can call OpenAI API to generate workout plans based on the message
    # For now, just echo the message back
    # Add a form to allow users to save the workout.
    message_with_form = message + '''<form action="/save_workout" method="POST">
                                        <input type="hidden" name="workout" value="''' + message + '''">
                                        <button type="submit">Save Workout</button>
                                     </form>'''
    socketio.emit('message', message_with_form)

@app.route('/save_workout', methods=['POST'])
def save_workout():
    if 'username' in session:
        username = session['username']
        workout = request.form['workout']
        users[username]['workouts'].append(workout)
        save_users()
        return redirect(url_for('my_workouts'))
    return redirect(url_for('login'))

if __name__ == '__main__':
    load_users()
    socketio.run(app, port=5001, debug=False)

