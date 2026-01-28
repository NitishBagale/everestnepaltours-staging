const ContactFrom = require("../../models/contactForm");

async function createContactFormService(formData) {
  try {
    return await ContactFrom.create(formData);
  } catch (error) {
    console.error("ContactForm creation error:", error);
    throw new Error("failed to create contact form entry: " + error.message);
  }
}

async function getAllContactFormsService() {
  try {
    return await ContactFrom.findAll({});
  } catch (error) {
    throw new Error("failed to fetch contact form entries: " + error.message);
  }
}

async function getContactFormByIdService(id) {
  try {
    const contactForm = await ContactFrom.findByPk(id);
    if (!contactForm) {
      throw new Error("Contact form entry not found");
    }
    return contactForm;
  } catch (error) {
    throw new Error("failed to fetch contact form entry: " + error.message);
  }
}

async function updateContactFormService(id, updateData) {
  try {
    const contactForm = await ContactFrom.findByPk(id);
    if (!contactForm) {
      throw new Error("Contact form entry not found");
    }
    await contactForm.update(updateData);
    return contactForm;
  } catch (error) {
    throw new Error("failed to update contact form entry: " + error.message);
  }
}

async function deleteContactFormService(id) {
  try {
    const contactForm = await ContactFrom.findByPk(id);
    if (!contactForm) {
      throw new Error("Contact form entry not found");
    }
    await contactForm.destroy();
    return;
  } catch (error) {
    throw new Error("failed to delete contact form entry: " + error.message);
  }
}

module.exports = {
  createContactFormService,
  getAllContactFormsService,
  getContactFormByIdService,
  updateContactFormService,
  deleteContactFormService,
};
