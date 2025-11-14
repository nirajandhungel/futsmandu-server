import nodemailer,{ Transporter } from 'nodemailer';
import {config} from '../config/environment.js';
import logger from '../utils/logger.js';

export class EmailService{
    private transporter:Transporter;

    constructor(){
        this.transporter = nodemailer.createTransport({
            host:config.email.host,
            port:config.email.port,
            secure:false,
            auth:{
                user:config.email.user,
                pass:config.email.password,
            },
        });
    }

    // send welcome email
    private async sendEmail(to:string, subject:string, html:string):Promise<void>{
        const mailOptions = {
            from: `"${config.email.from}" <${config.email.user}>`,
            to,
            subject,
            html
        };

        try{
            await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to}`);
        }catch(error){
            logger.error('Email sending failed ', {error, to});
            throw error;
        }
    }

    // send welcome email
    public async sendWelcomeEmail(to:string, fullName:string):Promise<void>{
        const subject = `Welcome to ${config.app.name}!`;
        const html = `
            <h1>Hello, ${fullName}!</h1>
            <p>Thank you for registering with our service. We're excited to have you on board!</p>
            <p>Best regards,<br/>The Team</p>
        `;
        await this.sendEmail(to, subject, html);
    }

    //send booking confirmation email

    // send booking cancellation email

    // send password reset email
}
