<form action="https://formspree.io/f/mrbyeabv" method="POST" class="contact-form">

  <!-- 第一行：First Name + Last Name -->
  <div class="form-group">
    <div class="name-row">
      <div class="name-field">
        <label for="first-name">First Name <span class="required">(required)</span></label>
        <input type="text" id="first-name" name="first-name" required>
      </div>
      <div class="name-field">
        <label for="last-name">Last Name <span class="required">(required)</span></label>
        <input type="text" id="last-name" name="last-name" required>
      </div>
    </div>
  </div>

  <!-- 第二行：Email -->
  <div class="form-group">
    <label for="email">Email Address <span class="required">(required)</span></label>
    <input type="email" id="email" name="_replyto" required>
  </div>

  <!-- 第三行：Message -->
  <div class="form-group">
    <label for="message">Message <span class="required">(required)</span></label>
    <textarea id="message" name="message" rows="6" placeholder="Feel free to send me anything" required></textarea>
  </div>

  <button type="submit">Send</button>
</form>
