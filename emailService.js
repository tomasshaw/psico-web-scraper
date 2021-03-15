const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = (header, body) => {
	return {
		from: 'El mejor novio del mundo',
		to: 'tomasshaw@outlook.com, eugemariotto@hotmail.com, eugeemariotto@gmail.com',
		subject: header,
		html: body
	}
};

const sendMail = (header, body) => transporter.sendMail(mailOptions(header, body), function(error, info){
  if (error) {
	console.log(error);
	process.exit(1)
  } else {
    console.log('Email sent: ' + info.response);
	process.exit(0)
  }
});

module.exports = {
	sendMail
}
