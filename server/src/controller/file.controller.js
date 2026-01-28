exports.handleSingleFileController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a file with field name 'document'",
      });
    }
    
    let link = req.file.path;
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      result: link,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.handleMultipleFileController = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded. Please select files with field name 'document'",
      });
    }
    
    // Map through the files and get each file's Cloudinary URL
    let links = req.files.map((file) => file.path);
    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      result: links,
    });

    console.log(links)
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
