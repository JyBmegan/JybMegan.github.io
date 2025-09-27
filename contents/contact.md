
<form action="https://formspree.io/f/mrbyeabv" method="POST" class="contact-form">

  <!-- 第一行：Last Name + First Name -->
  <label for="last-name">Last Name:</label>
  <input type="text" id="last-name" name="last-name" required>
  
  <label for="first-name">First Name:</label>
  <input type="text" id="first-name" name="first-name" required>
  <br><br>

  <!-- 第二行：Email -->
  <label for="email">Email:</label>
  <input type="email" id="email" name="_replyto" required>
  <br><br>

  <!-- 第三行：Message -->
  <label for="message">Message (Feel free to send me anything):</label><br>
  <textarea id="message" name="message" rows="6" required></textarea>
  <br><br>

  <button type="submit">Send</button>
</form>
