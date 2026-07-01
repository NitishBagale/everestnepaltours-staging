const { sendContactFormNotification } = require("../lib/mail/send.mail");

exports.uploadQR = async (req, res, next) => {
    try {
        let images = req.files.map((file) => file.path);
        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            data: images
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


exports.createContactForm = async (req,res) =>{
    try {
        const formData = req.body;
        await sendContactFormNotification({
            fullName: formData.fullName,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            sourcePage: req.get("referer"),
            ip: req.ip,
        });

        res.status(201).json({
            message: "Contact form submitted successfully",
            data: {
                fullName: formData.fullName,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
            },
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
}
