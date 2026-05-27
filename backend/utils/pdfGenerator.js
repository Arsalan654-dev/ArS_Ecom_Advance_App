import PDFDocument from 'pdfkit';

export const generateUserProfilePDF = (user, addresses) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            let pdfBuffer = Buffer.alloc(0);

            doc.on('data', (chunk) => {
                pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
            });

            doc.on('end', () => {
                resolve(pdfBuffer);
            });

            doc.on('error', (err) => {
                reject(err);
            });

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Vingo Profile Information', { align: 'center' });
            doc.fontSize(10).fillColor('#666').text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });
            doc.moveDown(0.5);

            // User Information Section
            doc.fontSize(14).fillColor('#333').font('Helvetica-Bold').text('Personal Information');
            doc.fontSize(0.5).strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.3);

            const userInfoData = [
                { label: 'Full Name:', value: user.fullName || 'N/A' },
                { label: 'Email:', value: user.email || 'N/A' },
                { label: 'Mobile:', value: user.mobile || 'N/A' },
                { label: 'Role:', value: user.role || 'User' },
                { label: 'Email Verified:', value: user.isEmailVerified ? 'Yes' : 'No' },
                { label: 'Google Verified:', value: user.isGoogleVerified ? 'Yes' : 'No' },
                { label: 'Two-Factor Enabled:', value: user.twoFactorEnabled ? 'Yes' : 'No' },
                { label: 'Member Since:', value: new Date(user.createdAt).toLocaleDateString() },
            ];

            doc.fontSize(11).fillColor('#000');
            userInfoData.forEach(item => {
                doc.font('Helvetica-Bold').text(item.label, { width: 150, continued: true });
                doc.font('Helvetica').text(item.value);
            });

            doc.moveDown(0.8);

            // Addresses Section
            if (addresses && addresses.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Saved Addresses');
                doc.fontSize(0.5).strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(0.3);

                addresses.forEach((address, index) => {
                    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text(`Address ${index + 1}: ${address.label}${address.customLabel ? ' - ' + address.customLabel : ''}`);
                    
                    const addressDetails = [
                        address.fullAddress,
                        `${address.city}, ${address.state} ${address.pincode}`,
                        address.country,
                        address.landmark ? `Landmark: ${address.landmark}` : '',
                        address.phoneNumber ? `Phone: ${address.phoneNumber}` : '',
                        address.receiverName ? `Receiver: ${address.receiverName}` : '',
                        address.instructions ? `Instructions: ${address.instructions}` : '',
                        address.isDefault ? '✓ Default Address' : ''
                    ].filter(item => item);

                    doc.fontSize(10).font('Helvetica').fillColor('#000');
                    addressDetails.forEach(detail => {
                        doc.text('  • ' + detail);
                    });

                    doc.moveDown(0.4);
                });
            } else {
                doc.fontSize(11).fillColor('#666').text('No saved addresses');
                doc.moveDown(0.5);
            }

            // Footer
            doc.moveDown(0.5);
            doc.fontSize(9).fillColor('#999').text('This document contains your personal information from Vingo. Please keep it safe and secure.', { align: 'center' });
            doc.text('For security reasons, never share this document with unauthorized persons.', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};
