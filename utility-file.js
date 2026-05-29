// In your utility file (your-utility-file.js)
const express = require("express");
const app = express();
const Port = process.env.Port || 3000;
const bodyParser = require("body-parser");
//const { generateUserID } = require("./utility-file");
//const {generatePaymentID}= require("./utility-file");
const { authenticateUserByEmailAndPassword } = require("./authentication");
const pool = require("./db");
const session = require('express-session');
const isAuthenticated = require("./isLoggedIn");
const cheerio = require('cheerio');


async function generate_user_id() {
  try {
    const result = await pool.query('SELECT generate_user_id()');
    return result.rows[0].generate_user_id;
  } catch (error) {
    console.error('Error calling generate_user_id function:', error);
    throw error;
  }
}

async function generate_student_id() {
  try {
    const result = await pool.query('SELECT generate_student_id()');
    console.log("in the function $1",result.rows[0].generate_student_id);
    return result.rows[0].generate_student_id;
  } catch (error) {
    console.error('Error calling generate_student_id function:', error);
    throw error;
  }
}

async function generate_instructor_id() {
  try {
    const result = await pool.query('SELECT generate_instructor_id()');
    //console.log("in the function $1",result.rows[0].generate_instructor_id);
    return result.rows[0].generate_instructor_id;
  } catch (error) {
    console.error('Error calling generate_instructor_id function:', error);
    throw error;
  }
}

async function generate_course_id() {
  try {
    const result = await pool.query('SELECT generate_course_id()');
    //console.log("in the function $1",result.rows[0].generate_instructor_id);
    return result.rows[0].generate_course_id;
  } catch (error) {
    console.error('Error calling generate_instructor_id function:', error);
    throw error;
  }
}

async function generatePaymentID() {

  const payIDQuery = "SELECT COUNT(*) FROM PAYMENT";
  const payresult = await pool.query(payIDQuery);
  const paycount = parseInt(payresult.rows[0].count) + 1;
  //const paySerial = paycount.toString();
  const payment_ID = `Pay-${paycount}`;
  console.log("payment id is $1",payment_ID);
  return payment_ID;
}

async function extractSrcFromIframe(linkToResource) {
  const $ = cheerio.load(linkToResource);
  console.log($('iframe').attr('src'));
  return $('iframe').attr('src');
}

async function generateRatingId() {
  try {
    const client = await pool.connect();

    const result = await client.query('SELECT generate_rating_id() ');

    const ratingId = result.rows[0].generate_rating_id;
    console.log("in the function of rating");
    console.log(ratingId);
    return ratingId;
  } catch (error) {
    console.error('Error generating rating ID:', error);
    throw error; 
}}


module.exports = {
  generate_user_id,
  generate_instructor_id,
  generate_course_id,
  generate_student_id,
  generatePaymentID,
  generateRatingId,
  extractSrcFromIframe,
};
