function toggleChat() {
    var chatWindow = document.getElementById('chatWindow');
    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
    } else {
        chatWindow.style.display = 'none';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && event.target.value.trim() !== '') {
        sendMessage();
    }
}

function sendMessage() {
    var input = document.getElementById('messageInput');
    var message = input.value;
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
                messagesDiv.innerHTML += '<p>' + message + '</p>';
            });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });
});