/**
 * Generates the email HTML content for the 2FA authentication code.
 * @param {string} code - The 2FA code.
 * @returns {string} - HTML content for the email.
 */
export const generateTwoFactorEmail = (code) => {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #007bff;">Your Authentication Code</h2>
        <p>Dear Valued User,</p>
        <p>
          To complete your login to the <strong>AI ID Photo Generator</strong> platform, please use the authentication code below:
        </p>
        <p style="text-align: center; font-size: 20px; font-weight: bold; color: #007bff;">
          ${code}
        </p>
        <p>
          This code is valid for the next <strong>10 minutes</strong>. If you did not request this code, please disregard this email or contact our support team via harleyzhao123@gmail.com immediately.
        </p>
        <p>Thank you,<br>The <strong>AI ID Photo Generator</strong> Team</p>
        <hr style="border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #777;">
          Need help? Contact us at <a href="mailto:support@aiidphoto.com" style="color: #007bff;">support@aiidphoto.com</a>.
        </p>
      </div>
    `;
};
