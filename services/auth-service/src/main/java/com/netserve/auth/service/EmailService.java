package com.netserve.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${netserve.app.frontend-url}")
    private String frontendUrl;

    @Value("${netserve.app.from-email}")
    private String fromEmail;

    @Async
    public void sendPasswordResetEmail(String toEmail, String token, String firstName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Reset your NetServe password");
            helper.setText(buildResetEmailHtml(firstName, token), true);

            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildResetEmailHtml(String firstName, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #222222;overflow:hidden;">
                          <!-- Header -->
                          <tr>
                            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #222222;">
                              <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                                🌐 NetServe
                              </div>
                            </td>
                          </tr>
                          <!-- Body -->
                          <tr>
                            <td style="padding:32px 40px;">
                              <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#ffffff;">
                                Reset your password
                              </h1>
                              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                                Hi %s, we received a request to reset the password for your NetServe account.
                                Click the button below to choose a new password.
                              </p>
                              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                                <tr>
                                  <td style="background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:8px;padding:12px 32px;">
                                    <a href="%s" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                                      Reset Password
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#71717a;">
                                This link will expire in <strong style="color:#a1a1aa;">1 hour</strong>.
                                If you didn't request this, you can safely ignore this email.
                              </p>
                              <p style="margin:0;font-size:12px;line-height:1.5;color:#52525b;word-break:break-all;">
                                Or copy this link: %s
                              </p>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="padding:20px 40px;border-top:1px solid #222222;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#52525b;">
                                &copy; 2026 NetServe — ISP Management Platform
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(firstName, resetLink, resetLink);
    }
}
