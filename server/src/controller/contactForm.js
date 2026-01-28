const { ADMIN_MAIL } = require("../../config/env");
const { createContactFormService, getAllContactFormsService, updateContactFormService, deleteContactFormService, getContactFormByIdService } = require("../services/contactForm");
const sendMail = require("../utils/sendMail");
const path = require("path");
const pug = require("pug");

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
        const newContactForm = await createContactFormService(formData);
        
        // Compile the Pug template to HTML
        const templatePath = path.join(__dirname, '../views/contactFormEmail.jade');
        const htmlContent = pug.renderFile(templatePath, {
            fullName: newContactForm.fullName,
            email: newContactForm.email,
            subject: newContactForm.subject,
            message: newContactForm.message
        });

        await sendMail({
            to: ADMIN_MAIL,
            subject: `New Contact Form Submission from ${newContactForm.fullName}`,
            html: htmlContent,
        })

        res.status(201).json({
            message: "Contact form submitted successfully",
            data: newContactForm,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
}

exports.getAllContactForms = async (req,res) =>{
    try {
        const contactForms = await getAllContactFormsService();
        res.status(200).json({
            data: contactForms,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getContactFormById = async (req,res) =>{
    try {
        const id = req.params.id;
        const contactForm = await getContactFormByIdService(id);
        res.status(200).json({
            data: contactForm,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.updateContactForm =async (req,res) =>{
    try {
        const id = req.params.id;
        const updateData = req.body;
        const updatedContactForm = await updateContactFormService(id, updateData);
        res.status(200).json({
            message: "Contact form updated successfully",
            data: updatedContactForm,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.deleteContactForm = async (req,res) =>{
    try {
        const id = req.params.id;
        const result = await deleteContactFormService(id);
        res.status(200).json({
            message: "Contact form deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}