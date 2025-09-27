<form action="https://formspree.io/f/mrbyeabv" method="POST" class="contact-form">

  <!-- 第一行：Last Name + First Name -->
  <div class="form-row">
    <label for="last-name">Last Name:</label>
    <input type="text" id="last-name" name="last-name" required>

    <label for="first-name">First Name:</label>
    <input type="text" id="first-name" name="first-name" required>
  </div>

  <!-- 第二行：Email -->
  <div class="form-row">
    <label for="email">Email:</label>
    <input type="email" id="email" name="_replyto" required>
  </div>

  <!-- 第三行：Message -->
  <div class="form-row">
    <label for="message">Message (Feel free to send me anything):</label>
    <textarea id="message" name="message" rows="6" required></textarea>
  </div>

  <button type="submit">Send</button>
</form>
