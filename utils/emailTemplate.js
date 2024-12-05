// util/emailTemplates.js

/**
 * Generates the email HTML content for the password reset email.
 * @param {string} resetLink - The password reset link.
 * @returns {string} - HTML content for the email.
 */
export const generatePasswordResetEmail = (resetLink) => {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #007bff;">Password Reset Request</h2>
        <p>Dear Valued User,</p>
        <p>
          You recently requested to reset your password for your <strong>AI ID Photo Generator</strong> account.
          Click the button below to reset your password. This link is valid for the next <strong>1 hour</strong>.
        </p>
        <p style="text-align: center;">
          <a href="${resetLink}" 
             style="
               display: inline-block;
               padding: 10px 20px;
               margin: 10px 0;
               font-size: 16px;
               color: #fff;
               background-color: #007bff;
               text-decoration: none;
               border-radius: 5px;
             ">
            Reset Password
          </a>
        </p>
        <p>If you did not request a password reset, please ignore this email or contact our support via harleyzhao123@gmail.com if you have any concerns.</p>
        <p>Thank you,<br>The <strong>AI ID Photo Generator</strong> Team</p>
        <hr style="border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #777;">
          If you’re having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:<br />
          <a href="${resetLink}" style="color: #007bff;">${resetLink}</a>
        </p>
      </div>
    `;
};
