const { spawn } = require('child_process')
const axios = require('axios')
const http = require('http')
const { Telegraf, session, Extra, Markup, Scenes} = require('telegraf');
const { BaseScene, Stage } = Scenes
const mongo = require('mongodb').MongoClient;
const {enter, leave} = Stage
const stage = new Stage();
const Coinbase = require('coinbase');
var bodyParser = require('body-parser');
const Scene = BaseScene
const data = require('./data');
const Client = require('coinbase').Client;
const { lutimes } = require('fs');
const { response } = require('express');
let db 


const  bot = new Telegraf(data.bot_token)
mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db('ABot'+data.bot_token.split(':')[0])
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('Bot Is Started')
  bot.launch()
})
})

bot.use(session())
bot.use(stage.middleware())

const onCheck = new Scene('onCheck')
stage.register(onCheck)

const getWallet= new Scene('getWallet')
stage.register(getWallet)

const getMsg = new Scene('getMsg')
stage.register(getMsg)

const onWithdraw = new Scene('onWithdraw')
stage.register(onWithdraw)

const channels = data.channelsList
const ky1 = data.apikey
const ky2 = data.secretkey
const admin = data.bot_admin
const bot_cur = data.currency
const min_wd = data.min_wd
const ref_bonus = data.reffer_bonus
const daily_bonus = data.daily_bonus
const okays = "Successful"


const botStart = async (ctx) => {
try {

if(ctx.message.chat.type != 'private'){
  return
  }
   let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()

let q1 = rndInt(1,50)
let q2 = rndInt(1,50)
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
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
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
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
  }else{
  mustJoin(ctx)
  }}else{
 ctx.replyWithMarkdown('😑 _I thought you were smarter than this, ⚪️ Try Again to get another question_')
 }}
 } catch (err) {
    sendError(err, ctx)
  }
})  

bot.hears('👫 Referral', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
ctx.reply(
'<b>🔆 Your Referral Information</b>\n\n<b>🤴 User Info</b> : <a href="tg://user?id='+ctx.from.id+'">'+ctx.from.first_name+'</a>\n\n<b>⛅️ Refer Link -</b> https://t.me/'+data.bot_name+'?start=' + ctx.from.id +'\n\n<b>🌺 Refer and Earn</b> <b>'+ref_bonus+' '+bot_cur+'</b> \n\n',  {parse_mode: 'html'})
} catch (err) {
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
let perRound = 10000;
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
'📊 *Total members * *'+dData.length+' users*\n==========================\n*🌺 Per Refer**'+ref_bonus+'*\n\n*🎁 Daily Bonus '+daily_bonus+' '+bot_cur+'*\n\n📛* Minimum Withdrawal '+min_wd+' '+bot_cur+'*\n\n📤 *Total Payout:* *'+val.toFixed(8)+' '+bot_cur+'*\n\n🧭 *Server Time:* *'+time+' IST*')
}}
  catch (err) {
    sendError(err, ctx)
  }
})


bot.hears('🎰 Bonus', async (ctx) => {
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

ctx.replyWithMarkdown('*✅ Today you received '+daily_bonus+' '+bot_cur+'*\n\n*Come back tomorrow and try again.This Is free Bonus 🎁*').catch((err) => sendError(err, ctx))
}else{
var duration_in_hour= Math.abs(duration_in_hours - 24);
var hours= Math.floor(duration_in_hour);
var minutes = Math.floor((duration_in_hour - hours)*60);
var seconds = Math.floor(((duration_in_hour - hours)*60-minutes)*60);
ctx.replyWithMarkdown('*⛔️ You Already Recieved Bonus In Last 24 Hours*').catch((err) => sendError(err, ctx))

}
}  catch (err) {
    sendError(err, ctx)
  }
})


bot.hears('💳 Balance', async (ctx) => {
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

    let sup
    let query = min_wd*200
    if(sum > query ){
    sup = sum/100
    db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: sup}}, {upsert: true})
    } else {
sup = sum*1
}
    ctx.reply('🤴 *User : '+ctx.from.first_name+'*   \n\n🌤 *Balance : '+sum.toFixed(8)+' '+bot_cur+'*\n\n*⚜️ Refer And Earn More*\n*~~~~~~~~~~~~~~~~~~~~~~~~~~~*\n🛑 *Minimum Redeem : '+min_wd+' '+bot_cur+'*',{parse_mode:'markdown'})
} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('🏧 Wallet', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
    ctx.replyWithMarkdown('💡 *Your Coinbase Email is:* `'+ dbData[0].coinmail +'`',
   Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change '+data.currency+'/CoinBase Email', 'setemail')]
      ])
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.replyWithMarkdown('💡 *Your Coinbase Email is:* _not set_', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change '+data.currency+'/CoinBase Email', 'setemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.action('setemail', async (ctx) => {
  try {
  ctx.deleteMessage();
    ctx.replyWithMarkdown(
      '✏️ *Send now your '+bot_cur+'* to use it in future withdrawals!',{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
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

 let email_test = /[a-zA-Z0-9]/
 if(email_test.test(msg)){
 let check = await db.collection('allEmails').find({email:ctx.message.text}).toArray() // only not paid invited users
if(check.length===0){
ctx.replyWithMarkdown(
'🖊* Done:* Your new coinbase email is\n`'+ctx.message.text+'`',
{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true } }
  )  
   .catch((err) => sendError(err, ctx))
   db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
   db.collection('allEmails').insertOne({email:ctx.message.text,user:ctx.from.id}) 
}else{
ctx.reply('Seems This email have been used in bot before by another user! Try Again')
}
}else{
 ctx.reply('🖊 Error: This is not a valid email! Send /start to return to the menu, or send a correct one')
 }
} catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('🟢 Joined', async (ctx) => {
try {
let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

if(ctx.message.chat.type != 'private'){
  ctx.leaveChat()
  return
  }
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
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }
  }else{
  mustJoin(ctx)
  }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.hears('Withdraw 💵', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
  
let tgData = await bot.telegram.getChatMember(data.payment_channel, ctx.from.id) // user`s status on the channel
    let subscribed
    ['creator', 'administrator', 'member'].includes(tgData.status) ? subscribed = true : subscribed = false
if(subscribed){

let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))

let bal = bData[0].balance

let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
if(bal>=min_wd){
var post="📤 *How many "+bot_cur+" you want to withdraw?*\n\n    *Minimum:* "+min_wd.toFixed(8)+" "+bot_cur+"\n    *Maximum:* "+bal.toFixed(8)+" "+bot_cur+"\n    _Maximum amount corresponds to your balance_\n\n    ➡* Send now the amount of  you want to withdraw*"

ctx.replyWithMarkdown(post, { reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
ctx.scene.enter('onWithdraw')
}else{
ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd.toFixed(8)+" "+bot_cur+" in your balance to withdraw!*")
}
    }else{
    ctx.replyWithMarkdown('💡 *Your CoinBase wallet address:* `not set`', 
    Markup.inlineKeyboard([
      [Markup.button.callback('💼 Set or Change Your '+data.currency+'/CoinBase Email', 'setemail')]
      ])
      ) 
           .catch((err) => sendError(err, ctx))
    
}

}else{
mustJoin(ctx)
}

} catch (err) {
    sendError(err, ctx)
  }
})

onWithdraw.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('onWithdraw')
})

onWithdraw.on('text', async (ctx) => {
try {
var valid,time
time = new Date();
time = time.toLocaleString();
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 let msg = ctx.message.text*1
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown("❌ _Send a value that is numeric or a number_")
 ctx.scene.leave('onWithdraw')
 return
 }
 let dbData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
 
 let aData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

 
 let bData = await db.collection('withdrawal').find({userId: ctx.from.id}).toArray()
 let dData = await db.collection('vUsers').find({stat: 'stat'}).toArray()
let vv = dData[0].value*1

 let ann = msg*1
 let bal = dbData[0].balance*1
let wd = dbData[0].withdraw
let rem = bal-ann
let ass = wd+ann
let sta = vv+ann
let wallet = aData[0].coinmail
if((msg>bal) | ( msg<min_wd)){
ctx.replyWithMarkdown("😐 Send a value over *"+min_wd.toFixed(8)+" "+bot_cur+"* but not greater than *"+bal.toFixed(8)+" "+bot_cur+"* ")
return
 }
 
 if (bal >= min_wd && msg >= min_wd && msg <= bal) {
      
db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: rem, withdraw: ass}}, {upsert: true})
db.collection('vUsers').updateOne({stat: 'stat'}, {$set: {value: sta}}, {upsert: true})


axios
  .get('https://api.txt-dev.tk/cb/info?key='+ky1+'&pkey='+ky2+'&curr='+bot_cur+'&amount='+msg+'&address='+wallet+''
  )
  .then(function (response) {
    console.log(response.data);

    ctx.replyWithMarkdown('💴 *Your withdraw has been sent!\n💰 Check your wallet!\n✅ Check '+data.payment_channel+'*')
    bot.telegram.sendMessage(data.payment_channel,
      '📤 <b>'+bot_cur+' Withdraw Paid!</b>\n➖➖➖➖➖➖➖➖➖➖➖➖\n👤 <b>User : </b><a href="tg://user?id='+ctx.from.id+'">'+ctx.from.first_name+'</a>\n💵 <b>Amount : '+msg+'</b>\n🧰 <b>Wallet : </b>'+wallet+'\n➖➖➖➖➖➖➖➖➖➖➖➖\n🏧 <b>Transaction :</b> <a href="https://apis.txt-dev.tk/transaction/transaction.html">'+okays+'</a>\n➖➖➖➖➖➖➖➖➖➖➖➖\n🤖 <b>Bot Link - </b>@'+data.bot_name+'\n⏩ <b>Please Check Your Wallet</b>\n➖➖➖➖➖➖➖➖➖➖➖➖\n🧭 <b>Server Time : </b>'+time+' IST',{parse_mode: 'html',disable_webpage_preview:true}).catch((err) => sendError(err, ctx))
      bot.telegram.sendMessage(admin,'📤 <b>'+bot_cur+' Withdraw Paid!</b>\n➖➖➖➖➖➖➖➖➖➖➖➖\n👤 <b>User : </b><a href="tg://user?id='+ctx.from.id+'">'+ctx.from.first_name+'</a>\n💵 <b>Amount : '+msg+'</b>\n🧰 <b>Wallet : </b>'+wallet+'\n➖➖➖➖➖➖➖➖➖➖➖➖\n🏧 <b>Transaction :</b> <a href="https://apis.txt-dev.tk/transaction/transaction.html">'+okays+'</a>\n➖➖➖➖➖➖➖➖➖➖➖➖\n🤖 <b>Bot Link - </b>@'+data.bot_name+'\n⏩ <b>Please Check Your Wallet</b>\n➖➖➖➖➖➖➖➖➖➖➖➖\n🧭 <b>Server Time : </b>'+time+''
  )  })

  .catch(error => {
    console.error(error)
    ctx.replyWithMarkdown('The Bot Has Encountred An problem While Complating Your Withdraw Request\nYour Problem Is Sended AUtomatically To Bot Admin You Will Recieve Your Withdraw In 24 hours')
  })
  
  
}else{
 ctx.replyWithMarkdown("😐 Send a value over *"+min_wd+" "+bot_cur+"* but not greater than *"+bal.toFixed(8)+" "+bot_cur+"* ")
ctx.scene.leave('onWithdraw')
return
 }

} catch (err) {
    sendError(err, ctx)
  }
})



function rndFloat(min, max){
  return (Math.random() * (max - min + 1)) + min
}
function rndInt(min, max){
  return Math.floor(rndFloat(min, max))
}
  
  function mustJoin(ctx){
  let msg = '<b>🔎 Join Our All Channels:</b>\n➖➖➖➖➖➖➖➖➖➖➖<b>'
  for(var ind in channels){
  var cha = channels[ind]
  msg+='\n💠'+cha
  }
  msg+='</b>\n➖➖➖➖➖➖➖➖➖➖➖\n⛱<b>Payment Channel</b>\n<b>'+data.payment_channel+'</b>\n➖➖➖➖➖➖➖➖➖➖➖\n🛃 <b>Before Using This Bot!</b>'
  ctx.replyWithHTML(msg, {
   reply_markup:{
   keyboard: [['🟢 Joined']],disable_web_page_preview : true,
   resize_keyboard: true
   
  }
  })
  }
 


function starter (ctx) {
 ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})

   }

function sendError (err, ctx) {
  ctx.reply('An Error Happened ☹️: '+err.message)
 bot.telegram.sendMessage(admin, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

async function findUser(ctx){
let isInChannel= true;
let cha = data.channelscheck
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







