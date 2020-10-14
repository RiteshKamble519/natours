const nodemailer = require('nodemailer')

const sendEmail = async options => {
    //1.Create Transporter eg:Gmail
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD

        }
    })

    //2.Define email options
    const mailOptions = {
        from: 'Jonas Schmedtmann <hello@jonas.io>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }


    //3.Actually send email
    await transporter.sendMail(mailOptions) //returns promise and therefore making it async-await
}

module.exports = sendEmail