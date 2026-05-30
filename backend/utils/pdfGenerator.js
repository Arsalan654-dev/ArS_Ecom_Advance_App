// backend\utils\pdfGenerator.js

import PDFDocument from 'pdfkit';

export const generateUserProfilePDF = (user, addresses = []) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
                info: {
                    Title: `Vingo Profile - ${user.fullName}`,
                    Author: 'Vingo',
                    Subject: 'User Profile Information',
                    CreationDate: new Date()
                }
            });

            // ✅ Use chunks array (more reliable than repeated Buffer.concat)
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            const PURPLE = '#8B5CF6';
            const DARK = '#1F2937';
            const GRAY = '#6B7280';
            const LIGHT_GRAY = '#E5E7EB';

            // ───── Header banner ─────
            doc.rect(0, 0, doc.page.width, 90).fill(PURPLE);
            doc.fillColor('#FFFFFF')
               .font('Helvetica-Bold').fontSize(28)
               .text('Vingo', 50, 30);
            doc.font('Helvetica').fontSize(11)
               .text('Profile Information Report', 50, 62);
            doc.fontSize(9)
               .text(`Generated: ${new Date().toLocaleString()}`, 0, 30, {
                   align: 'right', width: doc.page.width - 50
               });

            // Reset to default
            doc.y = 120;
            doc.fillColor(DARK);

            // ───── Personal Information ─────
            doc.font('Helvetica-Bold').fontSize(16).fillColor(PURPLE)
               .text('Personal Information');
            doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4)
               .lineWidth(1).strokeColor(LIGHT_GRAY).stroke();
            doc.moveDown(0.6);

            const rows = [
                ['Full Name', user.fullName || 'N/A'],
                ['Email', user.email || 'N/A'],
                ['Mobile', user.mobile || 'Not provided'],
                ['Role', (user.role || 'user').charAt(0).toUpperCase() + (user.role || 'user').slice(1)],
                ['Email Verified', user.isEmailVerified ? '✓ Yes' : '✗ No'],
                ['Google Linked', user.isGoogleVerified ? '✓ Yes' : '✗ No'],
                ['Two-Factor Auth', user.twoFactorEnabled ? '✓ Enabled' : '✗ Disabled'],
                ['Member Since', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'],
            ];

            doc.fontSize(11);
            rows.forEach(([label, value]) => {
                const y = doc.y;
                doc.font('Helvetica-Bold').fillColor(GRAY).text(label, 50, y, { width: 150 });
                doc.font('Helvetica').fillColor(DARK).text(String(value), 200, y);
                doc.moveDown(0.4);
            });

            doc.moveDown(1);

            // ───── Saved Addresses ─────
            doc.font('Helvetica-Bold').fontSize(16).fillColor(PURPLE)
               .text(`Saved Addresses (${addresses.length})`);
            doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4)
               .lineWidth(1).strokeColor(LIGHT_GRAY).stroke();
            doc.moveDown(0.6);

            if (!addresses.length) {
                doc.font('Helvetica-Oblique').fontSize(11).fillColor(GRAY)
                   .text('No addresses saved.');
            } else {
                addresses.forEach((addr, i) => {
                    // Address card background
                    const startY = doc.y;
                    doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK)
                       .text(`${i + 1}. ${addr.label || 'Address'}${addr.customLabel ? ` (${addr.customLabel})` : ''}${addr.isDefault ? '  ⭐ Default' : ''}`, 50);
                    doc.moveDown(0.2);

                    doc.font('Helvetica').fontSize(10).fillColor(DARK);
                    const lines = [
                        addr.fullAddress,
                        `${addr.city || ''}${addr.state ? ', ' + addr.state : ''}${addr.pincode ? ' - ' + addr.pincode : ''}`,
                        addr.country ? `Country: ${addr.country}` : null,
                        addr.landmark ? `Landmark: ${addr.landmark}` : null,
                        addr.receiverName ? `Receiver: ${addr.receiverName}` : null,
                        addr.phoneNumber ? `Phone: ${addr.phoneNumber}` : null,
                        addr.instructions ? `Notes: ${addr.instructions}` : null,
                    ].filter(Boolean);

                    lines.forEach(l => doc.text(`   ${l}`));
                    doc.moveDown(0.8);
                });
            }

            // ───── Footer on every page ─────
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.font('Helvetica').fontSize(8).fillColor(GRAY)
                   .text(
                       `Vingo © ${new Date().getFullYear()}  •  Page ${i + 1} of ${pageCount}`,
                       50, doc.page.height - 40,
                       { align: 'center', width: doc.page.width - 100 }
                   );
            }

            doc.end();
        } catch (error) {
            console.error('PDF generation error:', error);
            reject(error);
        }
    });
};
