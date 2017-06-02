'use strict';

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true });

const Robot = function() {
   this.email = process.env.gmail;
   this.simplePass = process.env.simplePass;
   this.complexPass = process.env.complexPass;
};

Robot.prototype.login = function(){
    nightmare
        .goto('https://my.wealthsimple.com/app/login')
        .wait('input[name="email"]')
        .type('input[name="email"]', this.email)
        .type('input[name="password"]', this.simplePass)
        .click('button[type="submit"]')
        .wait('.number-value')
        .then(() => {
            return this.scrapeData();
        })
        .then((data) => {
            return this.sendEmail(data);
        })
        .catch((err) => {
            if(err) {
                return console.log(err);
            }
        });
}

Robot.prototype.scrapeData = function() {
    return nightmare
        .wait(5000) // for the purpose of demo
        .evaluate(() => {
            const data = {  // gathering necessary data
                'portfolioBalance' : document.getElementsByClassName('number-value')[0].innerText,
                'totalEarnings' : document.getElementsByClassName('number-value')[1].innerText,
                'timeWeighted' : document.getElementsByClassName('number-value')[3].innerText,
                'savingsOnFees' : document.getElementsByClassName('number-value')[5].innerText,
                'freeTrades' : document.getElementsByClassName('number-value')[6].innerText,
                'reinvestedDividends' : document.getElementsByClassName('number-value')[7].innerText
            };
            return data;
        })
        .end()  // exit electron browser
}

Robot.prototype.sendEmail = function(data) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'samuelsaninbox@gmail.com',
            pass: this.complexPass
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Samuel San 👻"' + '<' + this.email + '>', // sender address
        to: this.email, // list of receivers
        subject: 'Your WealthSimple Daily Update!', // Subject line
        text :
            'WealthSimple Stats' + '\n' + '\n' +
            'Porfolio Balance: ' + data.portfolioBalance + '\n' +
            'Total Earnings: ' + data.totalEarnings + '\n' +
            'Time Weighted: ' + data.timeWeighted + '\n' +
            'Savings On Fees: ' + data.savingsOnFees + '\n' +
            'Free Trades: ' + '$ ' + data.freeTrades + '\n' +
            'Reinvested Dividends: ' + data.reinvestedDividends
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}

const wealthSimpleBot = new Robot();
wealthSimpleBot.login();
