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

// function loadWorkouts(day) {
//     // Existing logic to remove 'selected' class from all buttons
//     document.querySelectorAll('.day').forEach(el => el.classList.remove('selected'));
//     // Existing logic to add 'selected' class to the clicked button
//     document.querySelector(`button[data-day='${day}']`).classList.add('selected');

//     // Fetch the workouts for the selected day and populate the workoutsContainer
//     fetch(`/get_workouts/${day}`)
//         .then(response => response.json())
//         .then(workouts => {
//             const container = document.getElementById('workoutsContainer');
//             const workoutGif = document.getElementById('workoutGif');
//             container.innerHTML = '';
//             if (Object.keys(workouts).length > 0) {
//                 workoutGif.style.display = 'none';
//                 fetch('exercise.html')
//                     .then(response => response.text())
//                     .then(htmlTemplate => {
//                         for (const [exercise, sets] of Object.entries(workouts)) {
//                             let exerciseHTML = htmlTemplate.replace('[EXERCISE_NAME]', exercise);
                            
//                             // remove
//                             console.log("Fetched Template:", htmlTemplate);
                            
//                             // Replace with the appropriate image URL if available
//                             let imageUrl = "https://www.kettlebellkings.com/cdn/shop/articles/barbell-deadlift-movement.gif?v=1692228918&width=700";
//                             exerciseHTML = exerciseHTML.replace('src="https://www.kettlebellkings.com/cdn/shop/articles/barbell-deadlift-movement.gif?v=1692228918&width=700"', `src="${imageUrl}"`);
                            
//                             let setsHTML = sets.map(set => `
//                                 <div class="set">
//                                     <input type="checkbox" class="set-checkbox">
//                                     <span>${set}</span>
//                                 </div>
//                             `).join('');
                            
//                             // remove
//                             console.log("Sets Data:", setsHTML);

//                             exerciseHTML = exerciseHTML.replace("<!--[SETS]-->", setsHTML);

//                             // remove
//                             console.log("Sets Data:", setsHTML);

//                             let exerciseDiv = document.createElement('div');
//                             exerciseDiv.innerHTML = exerciseHTML;
//                             container.appendChild(exerciseDiv);

//                             // Find the newly added exercise div and add event listeners
//                             const header = exerciseDiv.querySelector('.exercise-header');
//                             const setsDiv = exerciseDiv.querySelector('.sets');
//                             const expandBtn = header.querySelector('.expand-btn');
//                             const completedIndicator = header.querySelector('.completed-indicator');

//                             header.addEventListener('click', () => {
//                                 setsDiv.classList.toggle('hidden');
//                                 completedIndicator.classList.toggle('hidden');
//                                 expandBtn.textContent = setsDiv.classList.contains('hidden') ? '+' : '-';
//                             });
//                         }
//                     });
//             } else {
//                 workoutGif.style.display = 'block'; // Show the GIF because there are no workouts
//             }
//         });
// }

// Color code the days on page load

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
            container.innerHTML = '';

            // If there are no exercises for the day, show the GIF and return
            if (Object.keys(workouts).length === 0) {
                document.getElementById('workoutGif').style.display = 'block';
                return;
            } else {
                // Hide the GIF if there are exercises
                document.getElementById('workoutGif').style.display = 'none';
            }

            fetch('exercise.html')
                .then(response => response.text())
                .then(htmlTemplate => {
                    for (const [exercise, sets] of Object.entries(workouts)) {

                        // Replace with the appropriate image URL if available
                        let imageUrl = "https://www.kettlebellkings.com/cdn/shop/articles/barbell-deadlift-movement.gif?v=1692228918&width=700";
                        let exerciseHTML = htmlTemplate.replace('src="https://www.kettlebellkings.com/cdn/shop/articles/barbell-deadlift-movement.gif?v=1692228918&width=700"', `src="${imageUrl}"`);

                        let setsHTML = sets.map(set => `
                            <div class="set">
                                <input type="checkbox" class="set-checkbox">
                                <span>${set}</span>
                            </div>
                        `).join('');

                        // Insert setsHTML into the .sets placeholder
                        exerciseHTML = exerciseHTML.replace('<!--[SETS]-->', setsHTML);

                        // Finally, replace [EXERCISE_NAME]
                        exerciseHTML = exerciseHTML.replace('[EXERCISE_NAME]', exercise);

                        let exerciseDiv = document.createElement('div');
                        exerciseDiv.innerHTML = exerciseHTML;

                        while (exerciseDiv.firstChild) {
                            container.appendChild(exerciseDiv.firstChild);
                        }

                        // Find the newly added exercise div and add event listeners
                        const header = container.lastChild.querySelector('.exercise-header');
                        const setsDiv = container.lastChild.querySelector('.sets');
                        const expandBtn = header.querySelector('.expand-btn');
                        const completedIndicator = header.querySelector('.completed-indicator');

                        header.addEventListener('click', () => {
                            setsDiv.classList.toggle('hidden');
                            completedIndicator.classList.toggle('hidden');
                            expandBtn.textContent = setsDiv.classList.contains('hidden') ? '+' : '-';
                        });
                    }
                });
        });
}

function colorCodeDays() {
    let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        let button = document.querySelector(`button[data-day='${day}']`);
        
        // Check if it's the current day
        if (new Date().toLocaleString('en-us', { weekday: 'long' }) === day) {
            button.style.backgroundColor = 'green'; // Current day
        } else {
            // Fetch workouts for the day
            fetch(`/get_workouts/${day}`)
                .then(response => response.json())
                .then(workouts => {
                    if (Object.keys(workouts).length > 0) { // If there are workouts
                        button.style.backgroundColor = 'blue';
                    } else {
                        button.style.backgroundColor = 'grey'; // Rest days
                    }
                })
                .catch(error => {
                    console.error("Error fetching workouts for " + day + ": ", error);
                    button.style.backgroundColor = 'grey'; // Default to grey if there's an error
                });
        }
    });
}

// On page load, call the loadWorkouts function with the current day
document.addEventListener('DOMContentLoaded', function () {
    let today = new Date().toLocaleString('en-us', { weekday: 'long' });
    loadWorkouts(today); // This should load the workout for the current day
    colorCodeDays(); // This should color the current day button green
});