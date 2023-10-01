function toggleChat() {
    var chatWindow = document.getElementById('chatWindow');
    chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // Check if Enter was pressed without Shift
        event.preventDefault(); // Prevent newline addition in multiline input
        sendMessage(); // Call your sendMessage function
    }
}

function sendMessage() {
    var input = document.getElementById('messageInput');
    var message = input.value.trim(); // Trim leading and trailing whitespaces
    if(message === '') return; // If message is only whitespace, don't send it
    input.value = '';

    // Send the new message to the server
    fetch('/send_message', {
        method: 'POST',
        body: new URLSearchParams({ message: message })
    });

    // Append the new message to the messages div
    var messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML += '<p>' + message + '</p>';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function () {
    // Load the previous messages when the page loads
    fetch('/get_messages')
        .then(response => response.json())
        .then(messages => {
            var messagesDiv = document.getElementById('messages');
            messages.forEach(message => {
                // Assuming message is a string. If it's an object, you may need to adjust this line accordingly.
                messagesDiv.innerHTML += '<p>' + message + '</p>';
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom to see the latest messages
        });

    // Add keypress event listener to the messageInput element
    document.getElementById('messageInput').addEventListener('keypress', handleKeyPress);
});

function loadWorkouts(day) {
    // Existing logic to remove 'selected' class from all buttons
    document.querySelectorAll('.day').forEach(el => el.classList.remove('selected'));
    // Existing logic to add 'selected' class to the clicked button
    document.querySelector(`button[data-day='${day}']`).classList.add('selected');

    // Fetch the workouts for the selected day and populate the workoutsContainer
    fetch(`/get_workouts/${day}`)
        .then(response => response.json())
        .then(workouts => {
            const container = document.getElementById('workoutsContainer');
            container.innerHTML = ''; // Clear previous workouts
            if (Object.keys(workouts).length > 0) { // If there are workouts
                document.getElementById('workoutGif').style.display = 'block'; // Show the GIF
                for (const [exercise, sets] of Object.entries(workouts)) {
                    const exerciseDiv = document.createElement('div');
                    exerciseDiv.className = 'exercise';
                    
                    const header = document.createElement('div');
                    header.className = 'exercise-header';
                
                    const expandBtn = document.createElement('button');
                    expandBtn.className = 'expand-btn';
                    expandBtn.textContent = '+'; 
                    header.appendChild(expandBtn);
                
                    const title = document.createElement('span');
                    title.className = 'exercise-title';
                    title.textContent = exercise;
                    header.appendChild(title);
                
                    const completedIndicator = document.createElement('span');
                    completedIndicator.className = 'completed-indicator';
                    completedIndicator.textContent = 'Completed'; 
                    header.appendChild(completedIndicator);
                
                    exerciseDiv.appendChild(header);
                    
                    const setsDiv = document.createElement('div');
                    setsDiv.className = 'sets hidden';
                    // ... rest of your logic to create sets ...
                    exerciseDiv.appendChild(setsDiv);
                    
                    header.addEventListener('click', () => {
                        setsDiv.classList.toggle('hidden');
                        completedIndicator.classList.toggle('hidden');
                        expandBtn.textContent = setsDiv.classList.contains('hidden') ? '+' : '-';
                    });
                    
                    container.appendChild(exerciseDiv);
                }          
            } else {
                document.getElementById('workoutGif').style.display = 'none'; // Hide the GIF
            }
        });
}

// New function to color code the days on page load
function colorCodeDays() {
    let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        fetch(`/get_workouts/${day}`)
            .then(response => response.json())
            .then(workouts => {
                let button = document.querySelector(`button[data-day='${day}']`);
                if (Object.keys(workouts).length > 0) { // If there are workouts
                    if (new Date().toLocaleString('en-us', { weekday: 'long' }) === day) {
                        button.style.backgroundColor = 'green'; // Current day with workouts
                    } else {
                        button.style.backgroundColor = 'blue'; // Other days with workouts
                    }
                } else {
                    button.style.backgroundColor = 'grey'; // Rest days
                }
            });
    });
}

// On page load, call the loadWorkouts function with the current day
document.addEventListener('DOMContentLoaded', function () {
    let today = new Date().toLocaleString('en-us', { weekday: 'long' });
    loadWorkouts(today);
    colorCodeDays(); // Color code the days when the document is loaded.
});
