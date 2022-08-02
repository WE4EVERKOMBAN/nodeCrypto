const { Telegraf, session, Extra, Markup, Scenes} = require('telegraf');
const { BaseScene, Stage } = Scenes
const mongo = require('mongodb').MongoClient;
const {enter, leave} = Stage
const stage = new Stage();
// const Coinbase = require('coinbase');
// const coinpayments = require('coinpayments');

//const express = require('express')
//var bodyParser = require('body-parser');
//const crypto = require("crypto"); 
//const app = express()
//app.use(bodyParser.urlencoded({ extended: false }));
const Scene = BaseScene
//app.use(bodyParser.json());
const data = require('./data');
// const Client = require('coinbase').Client;
let db 


const  bot = new Telegraf(data.bot_token)
mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db('MetaJokerAirdropBot')
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('🤖 is listening to your commands')
  bot.launch()
})
})

bot.use(session())
bot.use(stage.middleware())

const onCheck = new Scene('onCheck')
stage.register(onCheck)
const onConfirm = new Scene('onConfirm')
stage.register(onConfirm)
const getWallet= new Scene('getWallet')
stage.register(getWallet)

const getMsg = new Scene('getMsg')
stage.register(getMsg)

const onWithdraw = new Scene('onWithdraw')
stage.register(onWithdraw)

const channels = data.channelsList
const cb_api_key = data.cb_api_key
const cb_api_secret = data.cb_api_secret
const cb_account_id = data.cb_account_id
const admin = data.bot_admin
const bot_cur = data.currency
const min_wd = data.min_wd
const ref_bonus = data.reffer_bonus
const daily_bonus = data.daily_bonus

// var client = new Client({
//    apiKey: cb_api_key,
//    apiSecret: cb_api_secret ,strictSSL: false
// });




const botStart = async (ctx) => {
try {

if(ctx.message.chat.type != 'private'){
  return
  }
   let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()

let q1 = rndInt(1,10)
let q2 = rndInt(1,10)
let ans = q1+q2
  
  if(bData.length===0){
  if(ctx.startPayload && ctx.startPayload != ctx.from.id){
let ref = ctx.startPayload * 1
  db.collection('pendUsers').insertOne({userId: ctx.from.id, inviter: ref})}else{
db.collection('pendUsers').insertOne({userId: ctx.from.id})
}
  
  db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, paid: false })
   db.collection('balance').insertOne({userId: ctx.from.id, balance:0,withdraw:0})
  db.collection('checkUsers').insertOne({userId: ctx.from.id, answer:ans})
 await  ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\n*Send your answer now*',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
 ctx.scene.enter('onCheck')
 }else{
  let joinCheck = await findUser(ctx)
  if(joinCheck){
  let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in dbData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+ref_bonus+' '+bot_cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    ctx.replyWithMarkdown(
      '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
      { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
      disable_web_page_preview : 'true'})      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

      ctx.replyWithMarkdown(
        '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
        { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
        disable_web_page_preview : 'true'})    }
      }else{
  mustJoin(ctx)
  }}


} catch(e){
sendError(e, ctx)
}
}



bot.start(botStart)

bot.hears(['⬅️ Back','🔙 back'], botStart)


  
  
  

bot.hears('⚪️ Try Again', async (ctx) => {
try {
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){

let q1 = rndInt(1,50)
let q2 = rndInt(1,50)
let ans = q1+q2
db.collection('checkUsers').updateOne({userId: ctx.from.id}, {$set: {answer: ans}}, {upsert: true})
  
await ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\nSend your answer now',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
}else{
starter(ctx)
return
}

  } catch (err) {
    sendError(err, ctx)
  }
})



onCheck.hears(['⚪️ Try Again','/start'], async (ctx) => {
 try {
 
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
ctx.scene.leave('onCheck')


let q1 = rndInt(1,50)
let q2 = rndInt(1,50)
let ans = q1+q2
db.collection('checkUsers').updateOne({userId: ctx.from.id}, {$set: {answer: ans}}, {upsert: true})
  
await ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\nSend your answer now',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
}else{
return
}
 } catch (err) {
    sendError(err, ctx)
  }
})  

onCheck.on('text', async (ctx) => {
 try {
 let dbData = await db.collection('checkUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
 let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let ans = dbData[0].answer*1
 
 
  if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown('😑 _I thought you were smarter than this, try again_ ')
 }else{
if(ctx.message.text==ans){
 db.collection('vUsers').insertOne({userId: ctx.from.id, answer:ans,name:valid})
 ctx.deleteMessage()
 
 ctx.scene.leave('onCheck')
 let joinCheck = await findUser(ctx)
  if(joinCheck){
  let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in dData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+ref_bonus+' '+bot_cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    ctx.replyWithMarkdown(
      '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
      { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
      disable_web_page_preview : 'true'})      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

      ctx.replyWithMarkdown(
        '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
        { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
        disable_web_page_preview : 'true'})    }
  }else{
  mustJoin(ctx)
  }}else{
 ctx.replyWithMarkdown('🤓 _Wrong Answer! Please try again or Click ⚪️ Try Again to get another question_')
 }}
 } catch (err) {
    sendError(err, ctx)
  }
})  

bot.hears('🙌🏻 Invite', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
ctx.replyWithMarkdown(
  '*🙌🏻 User =* [' + ctx.from.first_name + '](tg://user?id=' + ctx.from.id +')\n\n*🙌🏻 Your Invite Link = https://t.me/'+ctx.botInfo.username+'?start='+ctx.from.id+'\n\n*Total Invite -- '+ allRefs.length +'* \n\n🪢 Invite To Earn More*', { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true } }
)} catch (err) {
    sendError(err, ctx)
  }
})

bot.command('broadcast', (ctx) => {
if(ctx.from.id==admin){
ctx.scene.enter('getMsg')}
})

getMsg.enter((ctx) => {
  ctx.replyWithMarkdown(
    ' *Okay Admin 👮‍♂, Send your broadcast message*', 
    { reply_markup: { keyboard: [['⬅️ Back']], resize_keyboard: true } }
  )
})

getMsg.leave((ctx) => starter(ctx))

getMsg.hears('⬅️ Back', (ctx) => {ctx.scene.leave('getMsg')})


getMsg.on('text', (ctx) => {
ctx.scene.leave('getMsg')

let postMessage = ctx.message.text
if(postMessage.length>3000){
return ctx.reply('Type in the message you want to sent to your subscribers. It may not exceed 3000 characters.')
}else{
globalBroadCast(ctx,admin)
}
})

async function globalBroadCast(ctx,userId){
let perRound = 100;
let totalBroadCast = 0;
let totalFail = 0;

let postMessage =ctx.message.text

let totalUsers = await db.collection('allUsers').find({}).toArray()

let noOfTotalUsers = totalUsers.length;
let lastUser = noOfTotalUsers - 1;

 for (let i = 0; i <= lastUser; i++) {
 setTimeout(function() {
      sendMessageToUser(userId, totalUsers[i].userId, postMessage, (i === lastUser), totalFail, totalUsers.length);
    }, (i * perRound));
  }
  return ctx.reply('Your message is queued and will be posted to all of your subscribers soon. Your total subscribers: '+noOfTotalUsers)
}

function sendMessageToUser(publisherId, subscriberId, message, last, totalFail, totalUser) {
  bot.telegram.sendMessage(subscriberId, message,{parse_mode:'html'}).catch((e) => {
if(e == 'Forbidden: bot was block by the user'){
totalFail++
}
})
let totalSent = totalUser - totalFail

  if (last) {
    bot.telegram.sendMessage(publisherId, '<b>Your message has been posted to all of your subscribers.</b>\n\n<b>Total User:</b> '+totalUser+'\n<b>Total Sent:</b> '+totalSent+'\n<b>Total Failed:</b> '+totalFail, {parse_mode:'html'});
  }
}
 
 



bot.hears('📊 Stat', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}
  
  let time;
time = new Date();
time = time.toLocaleString();

bot.telegram.sendChatAction(ctx.from.id,'typing').catch((err) => sendError(err, ctx))
let dbData = await db.collection('vUsers').find({stat:"stat"}).toArray()
let dData = await db.collection('vUsers').find({}).toArray()

if(dbData.length===0){
db.collection('vUsers').insertOne({stat:"stat", value:0})
ctx.replyWithMarkdown(
'😎 *Total members:* `'+dData.length+'`\n😇 *Total Payout:* `0.00000000 '+bot_cur+'`\n🧭 *Server Time:* `'+time+'`')
return
}else{
let val = dbData[0].value*1
ctx.replyWithMarkdown(
'😎 *Total members:* `'+dData.length+' users`\n😇 *Total Payout:* `'+val.toFixed(5)+' '+bot_cur+'`\n🧭 *Server Time:* `'+time+'`')
}}
  catch (err) {
    sendError(err, ctx)
  }
})


bot.hears('🎁 Bonus', async (ctx) => {
try {

if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

var duration_in_hours;

var tin = new Date().toISOString();
let dData = await db.collection('bonusforUsers').find({userId: ctx.from.id}).toArray()

if(dData.length===0){
db.collection('bonusforUsers').insertOne({userId: ctx.from.id, bonus: new Date()})
duration_in_hours = 99;
}else{
 duration_in_hours = ((new Date()) - new Date(dData[0].bonus))/1000/60/60;
}



if(duration_in_hours>=24){

let bal = await db.collection('balance').find({userId: ctx.from.id}).toArray()


let ran = daily_bonus
let rann = ran*1
var adm = bal[0].balance*1
var addo = adm+rann

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})

db.collection('bonusforUsers').updateOne({userId: ctx.from.id}, {$set: {bonus: tin}}, {upsert: true})

ctx.replyWithMarkdown('`✅ Today you received '+daily_bonus.toFixed(5)+' '+bot_cur+'`\n\n`Come back tomorrow and try again.This Is free Bonus 🎁`').catch((err) => sendError(err, ctx))
}else{
var duration_in_hour= Math.abs(duration_in_hours - 24);
var hours= Math.floor(duration_in_hour);
var minutes = Math.floor((duration_in_hour - hours)*60);
var seconds = Math.floor(((duration_in_hour - hours)*60-minutes)*60);
ctx.replyWithMarkdown('`❌ Bonus Adding Failed !\n\n💌 Come Back In: '+hours+':'+minutes+':'+seconds+' hrs`').catch((err) => sendError(err, ctx))

}
}  catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('📨 Information',async (ctx) => {
  
  ctx.replyWithMarkdown('*Token Information:*\n\n*Network:* `TomoChain`\n*Name:* `MetaJoker`\n*Symbol:* `MTJ`\n*Decimals:* `18`\n*Contract Address:* `0x6ce3DCA9639A2bB20965f35d0CE3A91a87397f1f`\n\n_👥 Referral: 10,000 $MTJ_\n‼️ _Withdraw: 10,000 $MTJ_\n\n*If you have followed our YouTube channel and Twitter, you will instantly recieve the payment✅✅*')
  })


bot.hears('💰 Balance', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  var valid;
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}
 
  
let notPaid = await db.collection('allUsers').find({inviter: ctx.from.id, paid: false}).toArray() // only not paid invited users
    let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
    let thisUsersData = await db.collection('balance').find({userId: ctx.from.id}).toArray()
    let sum
    sum = thisUsersData[0].balance

   /* if (thisUsersData[0].virgin) {
      sum = notPaid.length * 0.00001000
    } else {
      sum = notPaid.length * 0.00001000
    }*/
   
ctx.replyWithMarkdown(
  '*🙌🏻 User = ' + ctx.from.first_name + '\n\n💰 Balance = '+sum.toFixed(5)+' '+bot_cur+'\n\n🪢 Invite To Earn More*', { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true } }
)} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('🗂 Wallet', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
    ctx.replyWithMarkdown('💡 *Your TOMO CHAIN Address Is :* `'+ dbData[0].coinmail +'`',
   Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change Address', 'iamsetemail')]
      ])
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.replyWithMarkdown('💡 *Your TOMO CHAIN Address is:* _not set_', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change Address', 'iamsetemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.action('iamsetemail', async (ctx) => {
  try {
  ctx.deleteMessage();
    ctx.replyWithMarkdown(
      '✏️ *Send now your TOMO CHAIN Address* to use it in future withdrawals!',{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
        .catch((err) => sendError(err, ctx))
        ctx.scene.enter('getWallet')
  } catch (err) {
    sendError(err, ctx)
  }
})

getWallet.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('getWallet')
})

getWallet.on('text', async(ctx) => {
try {
let msg = ctx.message.text
if(msg == '/start'){
ctx.scene.leave('getWallet')
starter(ctx)
}

 let email_test = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

 let check = await db.collection('allEmails').find({email:ctx.message.text}).toArray() // only not paid invited users
if(check.length===0){
ctx.replyWithMarkdown(
'🖊* Done:* Your new *TOMO CHAIN* Address is\n`'+ctx.message.text+'`',
{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true } }
  )  
   .catch((err) => sendError(err, ctx))
   db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
   db.collection('allEmails').insertOne({email:ctx.message.text,user:ctx.from.id}) 
}else{
ctx.reply('Seems This Address have been used in bot before by another user! Try Again')
}

} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('✅  Check', async (ctx) => {
try {
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}


let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()

let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

  let joinCheck = await findUser(ctx)
  if(joinCheck){
       if(('inviter' in pData[0]) && !('referred' in dData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = ref_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+ref_bonus+' '+bot_cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: pData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    ctx.replyWithMarkdown(
      '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
      { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
      disable_web_page_preview : 'true'})      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

      ctx.replyWithMarkdown(
        '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
        { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
        disable_web_page_preview : 'true'})    }
  }else{
  mustJoin(ctx)
  }
} catch (err) {
    sendError(err, ctx)
  }
  
})
bot.hears('✅Done', async ctx=>{
  ctx.replyWithMarkdown(
    '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
    { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
    disable_web_page_preview : 'true'})

 })
// bot.hears('💳 Withdraw' ,async ctx => {
// ctx.reply('Bot budget Over')})
bot.hears('💳 Withdraw', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  
// let tgData = await bot.telegram.getChatMember(data.payment_channel, ctx.from.id) // user`s status on the channel

let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))

let bal = bData[0].balance

let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
if(bal>=min_wd){
var post="📤 *How many "+bot_cur+" you want to withdraw?*\n\n    *Minimum:* "+min_wd.toFixed(5)+" "+bot_cur+"\n    *Maximum:* "+bal.toFixed(5)+" "+bot_cur+"\n    _Maximum amount corresponds to your balance_\n\n    ➡* Send now the amount of  you want to withdraw*"

ctx.replyWithMarkdown(post, { reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})

ctx.scene.enter('onConfirm')
}else{
ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd.toFixed(5)+" "+bot_cur+" in your balance to withdraw!*")
}
    }else{
    ctx.replyWithMarkdown('💡 *Your TOMO CHAIN Address is:* `not set`', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change Wallet', 'iamsetemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    
    }


} catch (err) {
    sendError(err, ctx)
  }
})
onConfirm.on('text' , async (ctx) => {
  if (ctx.message.text == '🔙 back'){
    // let dbDasta = await db.collection('balance').find({userId: ctx.from.id}).toArray()
    db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {withhamount: 0}}, {upsert: true})
starter(ctx)
    ctx.scene.leave('onConfirm')

    return
    // ctx.scene.leave('onWithdraw')
  }else{
  let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
  let bal = bData[0].balance
var msggg = ctx.message.text*1
 db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {withhamount: msggg}}, {upsert: true})
 let aeData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let walleet = aeData[0].coinmail

  if (bal>=min_wd){
    ctx.replyWithMarkdown('*Confirm with your withdraw.*\n *Withdraw Amount*= `'+ctx.message.text+'`\n*Your Wallet Address *:- `'+walleet+'`\n\n_If You enter wrong amount and address. Then admin will be not responsible for fund loss_' , {reply_markup : {inline_keyboard : [[
      {text : 'Confirm' , callback_data : 'Checko'},
      {text : 'Decline' , callback_data : 'Deco'}

    ]]}})
    ctx.scene.leave('onConfirm')

  }else{
  ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd.toFixed(5)+" "+bot_cur+" in your balance to withdraw!*")
  } 
  
}})
bot.action('Deco' , async ctx => {
  ctx.scene.leave('onConfirm')
  let dbDasta = await db.collection('balance').find({userId: ctx.from.id}).toArray()
  db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {withhamount: 0}}, {upsert: true})

  starter(ctx)
ctx.editMessageText('Your Withdraw Is Cancelled')
})
// bot.action('Checko' , ctx => {
//   ctx.scene.enter(onWithdraw)
// })


bot.action('Checko', async (ctx) => {
  // ctx.deleteMessage();
  let dbDasta = await db.collection('balance').find({userId: ctx.from.id}).toArray()
  let dbData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
  let bal = dbData[0].balance*1
let msg = dbDasta[0].withhamount
if((msg>bal) | ( msg<min_wd)){
  ctx.replyWithMarkdown("😐 Send a value over *"+min_wd.toFixed(5)+" "+bot_cur+"* but not greater than *"+bal.toFixed(5)+" "+bot_cur+"* ")
  return
   }
   if (bal >= min_wd && msg >= min_wd && msg <= bal) {

try {
 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
let bData = await db.collection('withdrawal').find({userId: ctx.from.id}).toArray()
let dData = await db.collection('vUsers').find({stat: 'stat'}).toArray()
let vv = dData[0].value*1
let dbDasta = await db.collection('balance').find({userId: ctx.from.id}).toArray()

 let ann = msg*1
 let bal = dbData[0].balance*1
let wd = dbDasta[0].withhamount
let rem = bal-ann
let ass = wd+ann
let sta = vv+ann
let wallet = aData[0].coinmail

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {withhamount: 0}}, {upsert: true})

//  if (bal >= min_wd && msg >= min_wd && msg <= bal) {
  db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: rem, withdraw: ass}}, {upsert: true})
db.collection('vUsers').updateOne({stat: 'stat'}, {$set: {value: sta}}, {upsert: true})

 // enter coinpayment key
var curp = 'MetaJoker'
 ctx.replyWithMarkdown(   "✅ *Withdrawal Requested*\n_You will receive your Payment within Some Minutes!_\n\n💳 Transaction Details:" +
 "\n" +
 ann+
 " " +
 curp+
 " " +
 "to the wallet\n" +
 "`" +
 wallet +
 "`")
 const Web3 =  require('web3');
const web3 = new Web3('https://rpc.tomochain.com');

// Unlock wallet by private key
const pkey = '67f24b98cb420183c49c5398bf8ffbd346dc9efa716' // enter your private key here
const account = web3.eth.accounts.privateKeyToAccount(pkey)
const holder = account.address
web3.eth.accounts.wallet.add(account)
web3.eth.defaultAccount = holder
console.log(holder)
const trc20Abi = require('./TRC20.json')
const addrefss = '0x6ce3DCA9639A2bB20965f35d0CE3A91a87397f1f'    //enter your contract address here of the token
const trc20 = new web3.eth.Contract(trc20Abi,
   addrefss, {gasPrice: 250000000, gas: 300000  })

   trc20.methods.balanceOf(holder).call()
.then((result) => {
console.log(result)

}).catch(e => console.log(e))

.then((result) => {
console.log(result)
}).catch(e => console.log(e))

// send 500000000000000000000 tokens to this address (e.g decimals 18)
const to = "0xf8ac9d5022853c5847ef75aea0104eed09e5f402"
trc20.methods.transfer(wallet, `${msg}000000000000000000`).send({
from: holder,
gas: 300000,
value: 0,
contractAddress:'0xe3592A9c7538c64a37410E1c80cfb938b358FE80',
gasPrice: 250000000,
chainId: 88
})

.then((resrult) => {
console.log(resrult.transactionHash)
// ctx.reply(resrult)
// ctx.reply(resrult.transactionHash)
var reee = resrult.transactionHash
// var jio = "<b>📤 New Withdraw Request!\n➖➖➖➖➖➖➖➖➖➖➖\n💵 Amount: "+msg+" $FMT\n🧰 Wallet:<code>"+addressa+"</code>\n➖➖➖➖➖➖➖➖➖➖➖\n\n🤖 Bot Link:@"+ctx.botInfo.username+"</b>"

// var jio = "<b>📤 New Withdraw Request!\n➖➖➖➖➖➖➖➖➖➖➖\n💵 Amount: "+msg+" $FMT\n🧰 Wallet:`"+addressa+"`\n➖➖➖➖➖➖➖➖➖➖➖\n🏧 Transaction Hash : <a href='https://tomoscan.io/tx/"+reee+"'>" + reee + "</a>\n➖➖➖➖➖➖➖➖➖➖➖\n🤖 Bot Link:@"+ctx.botInfo.username+"</b>"
// bot.telegram.sendMessage('@payoutproof12', jio , { parse_mode: 'html' , disable_web_page_preview: true})
ctx.replyWithHTML("<b>Withdraw Successful\n🏧 Transaction Hash : <a href='https://tomoscan.io/tx/"+reee+"'>" + reee + "</a></b>",{
disable_web_page_preview:'true'
})

// ctx.reply(reee)
}).catch(e => console.log(e))

// console.log(txxid)/
// let paychannel = "@Autopay_World"; //add payout channel here
// var jio = "<b>📤 New Withdraw Paid!\n➖➖➖➖➖➖➖➖➖➖➖\n👤 User:<a href='tg://user?id=" + ctx.from.id + "'>"+ctx.from.id+"</a>\n💵 Amount: "+msg+" TOMO CHAIN\n🧰 Wallet:"+wallet+"\n➖➖➖➖➖➖➖➖➖➖➖\n🏧 Transaction Hash : <a href='https://digiexplorer.info/tx/"+cptid+"'>" + cptid + "</a>\n➖➖➖➖➖➖➖➖➖➖➖\n🤖 Bot Link:@"+ctx.botInfo.username+"</b>"
// ctx.reply(jio,{parse_mode : "html" , disable_web_page_preview : true})
// bot.telegram.sendMessage(paychannel, jio , { parse_mode: 'html' , disable_web_page_preview: true})




} catch (err) {
    sendError(err, ctx)
  }}else{
    ctx.replyWithMarkdown("😐 Send a value over *"+min_wd+" "+bot_cur+"* but not greater than *"+bal.toFixed(5)+" "+bot_cur+"* ")
   return
    }
})



function rndFloat(min, max){
  return (Math.random() * (max - min + 1)) + min
}
function rndInt(min, max){
  return Math.floor(rndFloat(min, max))
}
  
  function mustJoin(ctx){
 
    msg ='*🔎Join our all channel*\n*➖➖➖➖➖➖➖➖➖➖➖*\n*@Facinated_Airdrops\n@Apple_Airdrops\n@FortifyAirdrop\n@FacinatingAirdrops\n@unicorn_drops\n@Helpeveryone5*\n*➖➖➖➖➖➖➖➖➖➖➖*\n[🔰Subscribe Our YouTube Channel](https://youtube.com/channel/UCEELxgUJhss6mnpLCFqw9jg)\n[🔰Follow Our Twiter Account](https://twitter.com/AirdropPerfects)\n*➖➖➖➖➖➖➖➖➖➖➖*\n*🛃 Before Using This Bot!*', { parse_mode: 'markdown', disable_web_page_preview : 'true' , reply_markup: { inline_keyboard:[[{ text: "✅ Check", callback_data: "checkoo" }]]} }
  
  ctx.replyWithMarkdown(msg, { parse_mode: 'markdown', disable_web_page_preview : 'true' , reply_markup: { keyboard: [['✅  Check']], resize_keyboard: true } })
  }
 


function starter (ctx) {
  ctx.replyWithMarkdown(
    '[🏠 Main Menu](https://youtube.com/shorts/tBH7r2vf_fk)',
    { reply_markup: { keyboard: [['💰 Balance'],['🙌🏻 Invite','📨 Information','💳 Withdraw'], ['📊 Stat', '🗂 Wallet']], resize_keyboard: true }, 
    disable_web_page_preview : 'true'})

   }

function sendError (err, ctx) {
  console.log(err)
 bot.telegram.sendMessage(admin, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

async function findUser(ctx){
let isInChannel= true;
let cha = data.channelsList
for (let i = 0; i < cha.length; i++) {
const chat = cha[i];
let tgData = await bot.telegram.getChatMember(chat, ctx.from.id)
  
  const sub = ['creator','adminstrator','member'].includes(tgData.status)
  if (!sub) {
    isInChannel = false;
    break;
  }
}
return isInChannel
}

/*

var findUser = (ctx) => {
var user = {user: ctx.from.id }
channels.every(isUser, user)
}


var isUser = (chat) => {
console.log(this)
console.log(chat)
/*l

let sub = 

return sub == true;
}
*/
bot.command('hi' , ctx=> {
  db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: 2000}}, {upsert: true})
})

bot.command('createaccount' , ctx=> {
  const Web3 =  require('web3');

const web3 = new Web3('https://rpc.tomochain.com');
  const accd = web3.eth.accounts.create();
  console.log(accd);
  var fk = accd.privateKey;
  var ad = accd.address;
  ctx.replyWithMarkdown('*Private Key =*' +fk+ '/n/n *Account Address* =' +ad  )
})

