const Telegraf = require('telegraf')
const mongo = require('mongodb').MongoClient
const data = require('./data')
const WAValidator = require('multicoin-address-validator');
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const { leave } = Stage
const stage = new Stage()
const Coinpayments = require('coinpayments');
const opt = {
  key: data.cp_key,
  secret: data.cp_secret
}

const client = new Coinpayments(opt)

const min_wd = data.min_wd
const max_wd = data.max_wd
var cur = data.currency
const payment_channel = data.payment_channel
const refer_bonus = data.refer_bonus
const daily_bonus = data.daily_bonus
const channels = data.channels
const bot_username = data.bot_username


const bot = new Telegraf(data.token)
let db

/*const balance = new Scene('balance')
stage.register(balance)
const bonus = new Scene('bonus')
stage.register(bonus)
const referral = new Scene('referral')
stage.register(referral)
const withdraw = new Scene('withdraw')
stage.register(withdraw)*/

mongo.connect(data.mongoLink, {useUnifiedTopology: true}, (err, client) => {
  if (err) {
    console.log(err)
  }

  db = client.db('Bot-'+data.token.split(':')[0])
  bot.telegram.deleteWebhook().then(success => {
  success && console.log('🤖 is listening to your commands')
  bot.startPolling()
})

})

//const stage = new Stage()
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


bot.hears(/^\/start (.+[1-9]$)/, async (ctx) => { 
try { 
if(ctx.message.chat.type != 'private'){
  return
  }
   let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
 let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
    let botData = await db.collection('botData').find({bot: "mybot"}).toArray()
  
  if(botData.length===0){
  db.collection('botData').insertOne({bot: 'mybot',wdstat: "active",cur: cur,admin:data.admin,maxwd:data.maxwd}) .catch((err) => sendError(err, ctx))
  }
  
let q1 = rndInt(1,50)
let q2 = rndInt(1,50)
let ans = q1+q2
  
  if(bData.length===0){
  
  if(ctx.from.id != +ctx.match[1]) {
  db.collection('pendUsers').insertOne({userId: ctx.from.id, inviter: +ctx.match[1] })}
  
  db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, paid: false,inviter: +ctx.match[1] })
   db.collection('balance').insertOne({userId: ctx.from.id, balance:0,withdraw:0})
  db.collection('checkUsers').insertOne({userId: ctx.from.id, answer:ans})
 await  ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\n*Send your answer now*',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
  }else{
  let inChannel = await findUser(ctx)
  if(!inChannel){
await mustJoin(ctx) 
      }else{
      let pData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in dbData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = refer_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+refer_bonus+' '+cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: dbData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: dbData[0].inviter}, {$set: {balance: see}}, {upsert: true})
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
    }}}
  
   
 } catch (err) {
    sendError(err, ctx)
  }
})

bot.hears(['/start', '⬅️ Back'], async (ctx) => {
  try {
  
  if(ctx.message.chat.type != 'private'){
  return
  }
  
  let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
  let botData = await db.collection('botData').find({bot: "mybot"}).toArray()
  
  if(botData.length===0){
  db.collection('botData').insertOne({bot: 'mybot',wdstat: "active",cur:cur,admin:data.admin,maxwd:data.maxwd}) 
  }
  
let q1 = rndInt(1,50)
let q2 = rndInt(1,50)
let ans = q1+q2
  
  if(bData.length===0){
  db.collection('balance').insertOne({userId: ctx.from.id, balance:0,withdraw:0})
  db.collection('allUsers').insertOne({userId: ctx.from.id, virgin: true, balance: 0})
  db.collection('pendUsers').insertOne({userId: ctx.from.id})
  db.collection('checkUsers').insertOne({userId: ctx.from.id, answer:ans})
await  ctx.replyWithMarkdown('➡️*Hi, before you start the bot, please prove you are human by answering the question below.*\nPlease answer: '+q1+' + '+q2+' =\n*Send your answer now*',  { reply_markup: { keyboard: [['⚪️ Try Again']], resize_keyboard: true } })
ctx.scene.enter('onCheck')
  }else{
   let inChannel = await findUser(ctx)
  if(!inChannel){
console.log('passing')
await mustJoin(ctx) 
      }else{
      let pData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in pData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = refer_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+refer_bonus+' '+cur, {parse_mode:'markdown'})
    db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: pData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: dbData[0].inviter}, {$set: {balance: see}}, {upsert: true})
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
      
      }else{
      db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})

    }}}
  
  } catch (err) {
    sendError(err, ctx)
  }
})

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
 let inChannel = await findUser(ctx)
  if(!inChannel){
await mustJoin(ctx) 
      }else{
      let pData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
       if(('inviter' in pData[0]) && !('referred' in pData[0])){
   let bal = await db.collection('balance').find({userId: pData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = refer_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(pData[0].inviter, '➕ *New Referral on your link* you received '+refer_bonus+' '+cur, {parse_mode:'markdown'})
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
    }}}else{
 ctx.replyWithMarkdown('🤓 _Wrong Answer! Please try again or Click ⚪️ Try Again to get another question_')
 }}
 
 } catch (err) {
    sendError(err, ctx)
  }
})  

bot.command('wdset', async (ctx) => {
try {
if(ctx.from.id==data.admin){
let botData = await db.collection('botData').find({bot: "mybot"}).toArray()
let status = botData[0].wdstat
var stat;
if(status == "active"){
stat = '✅ Enabled'
ctx.replyWithMarkdown('*Current Withdrawal Status* = '+stat+'\n_you can disable it with the option below_', {reply_markup: { inline_keyboard: [[{text: '❌ Disable', callback_data: 'disable'}]]}})
}else{
stat = '❌ Disabled'
ctx.replyWithMarkdown('*Current Withdrawal Status* = '+stat+'\n_you can enable it with the option below_', {reply_markup: { inline_keyboard: [
[{text: '✅ Enable', callback_data: 'enable'}]]}})
}


}
 } catch (err) {
    sendError(err, ctx)
  }
})  

bot.action('enable', async (ctx) => {
try {
db.collection('botData').updateOne({bot: 'mybot'}, {$set: {wdstat:'active'}}, {upsert: true})
ctx.answerCbQuery()
var stat = '✅ Enabled'

ctx.editMessageText('Withdrawal Status is currently '+stat, {reply_markup: {inline_button:
[
[{text: '❌ Disable', callback_data: 'disable'}]]}})
} catch (err) {
    sendError(err, ctx)
  }
})  

bot.action('disable', async (ctx) => {
try {
db.collection('botData').updateOne({bot: 'mybot'}, {$set: {wdstat:'inactive'}}, {upsert: true})
ctx.answerCbQuery()
var stat = '❌ Disabled'

ctx.editMessageText('Withdrawal Status is currently '+stat, {reply_markup: {inline_button:
[
[{text: '✅ Enabled', callback_data: 'enable'}]]}})
} catch (err) {
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

   /* if (thisUsersData[0].virgin) {
      sum = notPaid.length * 0.00001000
    } else {
      sum = notPaid.length * 0.00001000
    }*/
    let sup
    if(sum>max_wd){
    sup = sum/100
    db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: sup}}, {upsert: true})
    } else {
sup = sum*1
}
    ctx.replyWithMarkdown('`♻️ Name : '+valid+'\n\n⚜️ User Code : '+ctx.from.id+'\n\n💰 Balance : '+sup.toFixed(8)+' '+cur+'\n\n♻️ Refer And Earn More`')
} catch (err) {
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


let rann = daily_bonus*1
var adm = bal[0].balance*1
var addo = adm+rann

db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})

db.collection('bonusforUsers').updateOne({userId: ctx.from.id}, {$set: {bonus: tin}}, {upsert: true})

ctx.replyWithMarkdown('`✅ Today you received '+daily_bonus+' '+cur+'`\n\n`Come back tomorrow and try again.This Is free Bonus 🎁`').catch((err) => sendError(err, ctx))
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

bot.hears('👫 Referral', async (ctx) => {
try {

console.log(ctx)
if(ctx.message.chat.type != 'private'){
  return
  }
  
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}

let allRefs = await db.collection('allUsers').find({inviter: ctx.from.id}).toArray() // all invited users
ctx.reply(
'*👥 You Invited: *'+ allRefs.length +' referrals\n*🔗 Your referral link:* https://t.me/'+data.bot_username.split('@')[1]+'?start=' + ctx.from.id +'\n\n💰 *Per Referral '+refer_bonus+' '+cur+'* - _Share Your referral link to your Friends & earn unlimited '+cur+'_\n\n⚠️ *Note*\n_Fake, empty or spam users are deleted after checking._',  {parse_mode: 'markdown'})
} catch (err) {
    sendError(err, ctx)
  }
})

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
'😎 *Total members:* `'+dData.length+'`\n😇 *Total Payout:* `0.00000000 '+cur+'`\n🧭 *Server Time:* `'+time+'`')
return
}else{
let val = dbData[0].value*1
ctx.replyWithMarkdown(
'😎 *Total members:* `'+dData.length+' users`\n😇 *Total Payout:* `'+val.toFixed(8)+' '+cur+'`\n🧭 *Server Time:* `'+time+'`')
}}
  catch (err) {
    sendError(err, ctx)
  }
})

bot.hears('adminbroadmsg', (ctx) => {
if(ctx.from.id==data.dev){
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

getMsg.on('text', async (ctx) => {
try {
ctx.replyWithMarkdown('✅ *Your global post has been successfully sent to your all users*')

ctx.scene.leave('getMsg')

await sleep(10000)
const perRound = 100;
const sleepMs = 20000;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

let counter = 0;
let totalBroadCast = 0;
let totalFail = 0;

db.collection('joinedUsers').find({}).forEach(async user => {
        if (counter === perRound) {
            await sleep(sleepMs);
            counter = 0;
        } else {
            counter += 1;
            console.log(`Counter: ${counter}`);
        }
        if (user.userId) {
            try {
            await  bot.telegram
                    .sendMessage(user.userId, ctx.message.text, { parse_mode: 'HTML' })
                    .then(() => (console.log(`Success: ${ totalBroadCast += 1}`)))
                    .catch(() => (console.log(`Error: ${totalFail += 1}`)));
            } catch (err) {
                totalFail += 1;
             //   console.log(`Total Failed: ${totalFail}`);
            }
        }
    });

console.log('Result: ');





} catch (err) {
    sendError(err, ctx)
  }
})

/*getMsg.on('text', async (ctx) => {
try {
ctx.replyWithMarkdown('✅ *Your global post has been successfully sent to your all users*')

ctx.scene.leave('getMsg')

db.collection('balance').find({}).forEach(function(i){
ctx.telegram.sendMessage(i.userId, ctx.message.text,{parse_mode:'html'})
})


} catch (err) {
    sendError(err, ctx)
  }
})*/

bot.hears('🔙 back', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  let bData = await db.collection('vUsers').find({userId: ctx.from.id}).toArray()
 
if(bData.length===0){
return}
let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()
let mustJoin = await db.collection('joinedUsers').find({userId: ctx.from.id}).toArray()

 ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
  
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
    ctx.reply('💡 *Your '+cur+' wallet is:* `'+ dbData[0].coinmail +'`',
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Email', 'iamsetemail')]
      ])) .markdown()
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.reply('💡 *Your '+cur+' wallet is:* _not set_', 
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Wallet', 'iamsetemail')]
      ])) .markdown()
      ) 
           .catch((err) => sendError(err, ctx))
    }
} catch (err) {
    sendError(err, ctx)
  }
  
})

bot.hears('💼 Set Wallet', async (ctx) => {
try {
let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
    ctx.reply('💡 *Your '+cur+' wallet is:* `'+ dbData[0].coinmail +'`',
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Email', 'iamsetemail')]
      ])) .markdown()
      )  
       .catch((err) => sendError(err, ctx))
    }else{
ctx.reply('💡 *Your '+cur+' wallet is:* `not set`', 
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Wallet', 'iamsetemail')]
      ])) .markdown()
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
      '✏️ *Send now your '+cur+' wallet* to use it in future withdrawals!',{ reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
        .catch((err) => sendError(err, ctx))
        ctx.scene.enter('getWallet')
  } catch (err) {
    sendError(err, ctx)
  }
})

getWallet.hears(['🔙 back','/start'], (ctx) => {
  starter(ctx)
  ctx.scene.leave('getWallet')
})

getWallet.on('text', async (ctx) => {
try{
let text = ctx.message.text

var valid = WAValidator.validate(text, 'DGB');
if(valid){
ctx.replyWithMarkdown(
'🖊 *Done:* Your new '+cur+' wallet is\n`'+ctx.message.text+'`'
  )  
   .catch((err) => sendError(err, ctx))

  db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {coinmail: ctx.message.text}}, {upsert: true})
  .catch((err) => sendError(err, ctx))
  ctx.scene.leave('getWallet')
}else{
ctx.reply('🖊 Error: This is not a wallet address! Send /start to return to the menu, or send a correct address')
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
let dbData = await db.collection('pendUsers').find({userId: ctx.from.id}).toArray()

let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()



let inChannel = await findUser(ctx)
  if(!inChannel){
await mustJoin(ctx) 
      }else{
   

 if(('inviter' in dbData[0]) && !('referred' in dData[0])){
 let bal = await db.collection('balance').find({userId: dbData[0].inviter}).toArray()

 var cal = bal[0].balance*1
 var sen = refer_bonus*1
 var see = cal+sen

   bot.telegram.sendMessage(dbData[0].inviter, '➕ *New Referral on your link* you received '+refer_bonus+' '+cur, {parse_mode:'markdown'})
   
 db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {inviter: dbData[0].inviter, referred: 'surenaa'}}, {upsert: true})
     db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true})
    db.collection('balance').updateOne({userId: dbData[0].inviter}, {$set: {balance: see}}, {upsert: true})
    

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})

  //db.collection('allUsers').updateOne({userId: ctx.from.id}, {$set: {balance: addo}}, {upsert: true})
 
 
    }else{
db.collection('joinedUsers').insertOne({userId: ctx.from.id, join: true}) 

 
ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})
}
}}
  catch (err) {
    sendError(err, ctx)
  }
})
    
    
    
    



bot.hears('Withdraw 💵', async (ctx) => {
try {
if(ctx.message.chat.type != 'private'){
  return
  }
  
let tgData = await bot.telegram.getChatMember(data.payment_channel, ctx.from.id) 
console.log(tgData)
// user`s status on the channel
    let subscribed = true
   // ['creator', 'administrator', 'member'].includes(tgData.status) ? subscribed = true : subscribed = false
if(subscribed){

let bData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))

let bal = bData[0].balance

let dbData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

    if ('coinmail' in dbData[0]) {
if(bal>=1){
var post="📤 *How many "+cur+" you want to withdraw?*\n\n    *Minimum:* "+min_wd+" "+cur+"\n    *Maximum:* "+bal.toFixed(8)+" "+cur+"\n    _Maximum amount corresponds to your balance_\n\n    ➡* Send now the amount of "+cur+"  you want to withdraw*"

ctx.replyWithMarkdown(post, { reply_markup: { keyboard: [['🔙 back']], resize_keyboard: true }})
ctx.scene.enter('onWithdraw')
}else{
ctx.replyWithMarkdown("❌ *You have to own at least "+min_wd+" "+cur+" in your balance to withdraw!*")
}
    }else{
    ctx.reply('💡 *Your '+cur+' wallet is:* `not set`', 
    Extra
      .markup(Markup.inlineKeyboard([
      [Markup.callbackButton('💼 Set or Change Wallet', 'iamsetemail')]
      ])) .markdown()
      ) 
           .catch((err) => sendError(err, ctx))
    
}

}else{
mustjoin(ctx)
}

} catch (err) {
    sendError(err, ctx)
  }
})

bot.action('decline',ctx=>
  {
   ctx.deleteMessage();
  ctx.reply("Withdrawal request was deleted successfully")
  })

onWithdraw.hears('🔙 back', (ctx) => {
  starter(ctx)
  ctx.scene.leave('onWithdraw')
})

onWithdraw.on('text', async (ctx) => {
try {

async function getwd2(cpid){

var opts = {
id:cpid
}

let wd = await client.getWithdrawalInfo(opts)
console.log(wd)
let status = wd.status_text
let txid = wd.send_txid

if(!txid){
setTimeout(getwd, 200000, cpid)
return
}
let addr = wd.send_address
let  amo = wd.amountf
let amot = amo*1-0.1
let cur = wd.coin
var txurl2 = "["+txid+"]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"

var valid;


let time;
time = new Date();
time = time.toLocaleString();
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 var mention="["+valid+"]"+"("+"tg://user?id="+ctx.from.id+")"
 let k="💵 *Withdrawal Paid*\nThe Owner Just *Automatically Paid *your withdrawal of *"+amo+" "+cur+"* on your wallet"+" \n"+"`"+ addr+"`"+"\n\n"+txurl2
await ctx.replyWithMarkdown(k,{disable_web_page_preview:true})
var txurl = "[PAID]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"
let texwd='🎁 *New Instant Withdraw* 🎁\n\n✅ *Status:* '+txurl+'\n✅ *User Id:* `'+ctx.from.id+'`\n✅ Amount: *'+amot.toFixed(7)+' '+cur+'*\n\n🚀 *Bot* '+bot_username+'\n\n❤️ _Invite your friends and earn more_'

await bot.telegram.sendMessage(payment_channel,texwd,{parse_mode:'markdown',disable_web_page_preview:true})
}


async function getwd(cpid){

var opts = {
id:cpid
}

let wd = await client.getWithdrawalInfo(opts)
console.log(wd)
let status = wd.status_text
let txid = wd.send_txid

if(!txid){
setTimeout(getwd2, 200000, cpid)
return
}
let addr = wd.send_address
let  amo = wd.amountf
let amot = amo*1-0.1
let cur = wd.coin
var txurl2 = "["+txid+"]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"

var valid;


let time;
time = new Date();
time = time.toLocaleString();
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 //var mention="[PAID]"+"("+"tg://user?id="+ctx.from.id+")"
 let k="💵 *Withdrawal Paid*\nThe Owner Just *Automatically Paid *your withdrawal of *"+amo+" "+cur+"* on your wallet"+" \n"+"`"+ addr+"`"+"\n\n"+txurl2
await ctx.replyWithMarkdown(k,{disable_web_page_preview:true})

var txurl = "[PAID]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"
let texwd='🎁 *New Instant Withdraw* 🎁\n\n✅ *Status:* '+txurl+'\n✅ *User Id:* `'+ctx.from.id+'`\n✅ Amount: *'+amot.toFixed(7)+' '+cur+'*\n\n🚀 *Bot* '+bot_username+'\n\n❤️ _Invite your friends and earn more_'



await bot.telegram.sendMessage(data.payment_channel,texwd,{parse_mode:'markdown',disable_web_page_preview:true})
}


let msg = ctx.message.text*1
 if(!isNumeric(ctx.message.text)){
 ctx.replyWithMarkdown("❌ _Send a value that is numeric or a number_")
 ctx.scene.leave('onWithdraw')
 return
 }
 


 let dbData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
 
 let dData = await db.collection('allUsers').find({userId: ctx.from.id}).toArray()

 
 let bData = await db.collection('withdrawal').find({userId: ctx.from.id}).toArray()
 
 let botData = await db.collection('botData').find({bot: "mybot"}).toArray()
 let ann = msg*1
 let bal = dbData[0].balance*1
let wd = dbData[0].withdraw
let rem = bal-ann
let ass = wd+ann
let curp = cur
let wallet = dData[0].coinmail

var valid;

 if((msg>bal) | ( msg<min_wd)){
ctx.replyWithMarkdown("😐 Send a value over *1 "+cur+"* but not greater than *"+bal.toFixed(2)+" "+cur+"*")
ctx.scene.leave('onWithdraw')
return
 }
let time;
time = new Date();
time = time.toLocaleString();
 
 if(ctx.from.last_name){
 valid = ctx.from.first_name+' '+ctx.from.last_name
 }else{
 valid = ctx.from.first_name
 }
 
 var mention="["+valid+"]"+"("+"tg://user?id="+ctx.from.id+")"


let wdsta = botData[0].wdstat
let maxwd = botData[0].maxwd

      if (bal >= min_wd && msg >= min_wd && msg <= bal) {
      
db.collection('balance').updateOne({userId: ctx.from.id}, {$set: {balance: rem, withdraw: ass}}, {upsert: true})



/*if(bData.length===0){
var tex = '✅ *'+ann.toFixed(8)+' TRX* on _'+time+'_\n💳 *Wallet:* `'+wallet+'`\n❗️Status: *Paid*'
db.collection('withdrawal').insertOne({userId: ctx.from.id, withdraw:tex})
}else{
var ttt = bData[0].withdraw

var tent = ttt+'\n\n✅ *'+ann.toFixed(8)+' LTC* on _'+time+'_\n💳 *Wallet:* `'+wallet+'`\n❗ Status: *Paid*'

db.collection('withdrawal').updateOne({userId: ctx.from.id}, {$set: {withdraw: tent}}, {upsert: true})
      }*/
      
      let myData = await db.collection('vUsers').find({stat:"stat"}).toArray()
      let withd= myData[0].value*1
      let conf = ann+withd
      db.collection('vUsers').updateOne({stat:"stat"},{$set: {value: conf}}, {upsert: true})

      
      if((wdsta =='inactive') | (msg>max_wd)){
      ctx.replyWithMarkdown(   "✅ *Withdrawal Requested*\n_You will receive your payment within 24 hours!_\n\n💳 Transaction Details:" +
              "\n" +
              msg+
              " " +
              curp+
              " " +
              "to the wallet\n" +
              "*" +
              wallet +
              "*")
              bot.telegram.sendMessage(data.admin, "✅ *New Withdrawal Request*\n\n👤 *By User:* "+mention+"\n💸 Balance: "+rem.toFixed(8)+" "+cur+"\n💰Amount: *"+msg.toFixed(8)+" "+cur+"*\n💼 *Wallet*: `"+wallet+"`\n\n👮‍♂ *Choose an Option Below Admin*", 
      {parse_mode: 'markdown',
      reply_markup: {
        inline_keyboard: [
[
{text: '⚙ Pay Automatic', callback_data: 'auto'+" "+msg+" "+ctx.from.id}
],

[
{text: '💸 Pay Manually',callback_data: 'manual'+" "+msg+" "+ctx.from.id}
],

[
{text: '♻️ Refund', callback_data: 'refund'+" "+msg+" "+ctx.from.id}
],

[
            { text: 'Delete Message❌', callback_data: 'decline'}
          ]
]
      }
      })
      }else{
      var wdo = {
     amount: msg,
     currency: cur,
     address: wallet,
     auto_confirm: 1
      }
 let wdp = await client.createWithdrawal(wdo)
 let status = wdp.status 
 if(status==1){
 let cpid = wdp.id
 let amont = wdp.amount
 ctx.replyWithMarkdown("✅* Withdrawal Requested*\nYour payment is being processed automatically right now!\n\n*Secured Payment ID:* \n"+cpid+"\n_You will receive TXID soon_"+"\n\n💳 *Transaction Details:* "+amont+" "+cur+" to the wallet\n"+"`"+wallet+"`")
 ctx.scene.leave('onWithdraw')
 setTimeout(getwd, 200000, cpid)
 let cData = await db.collection('balance').find({userId: ctx.from.id}).toArray().catch((err) => sendError(err, ctx))
 
 bot.telegram.sendMessage(data.admin,'User: ['+ctx.from.first_name+'](tg://user?id='+ctx.from.id+')\n Just Withdraw '+amont+' '+cur+' to the wallet '+wallet+'\n\nAvailabe Balance: '+cData[0].balance+' '+cur, {parse_mode: 'markdown'})
 
 
 }else{
 ctx.replyWithMarkdown('Error processing Automatic withdrawal')
 }
 
     
      }
      }
} catch (err) {
    sendError(err, ctx)
  }
})

bot.action(/auto [0-9]/, async ctx=>
  {
  try{
  
  
  async function getwid(cpid, id){

var opts = {
id:cpid
}

let wd = await client.getWithdrawalInfo(opts)

let status = wd.status_text
let txid = wd.send_txid
let addr = wd.send_address
let  amo = wd.amountf
let amot = amo
let cur = wd.coin
var txurl2 = "["+txid+"]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"

let dData = await db.collection('vUsers').find({userId: id}).toArray()
let valid = dData[0].name
let time;
time = new Date();
time = time.toLocaleString();
 
 var mention="["+valid+"]"+"("+"tg://user?id="+id+")"
 let k="💵 *Withdrawal Paid*\nThe Owner Just *Automatically Paid *your withdrawal of *"+amo+" "+cur+"* on your wallet"+" \n"+"`"+ addr+"`"+"\n\n"+txurl2
 
await bot.telegram.sendMessage(id,k,{disable_web_page_preview:true, parse_mode:'markdown'})

var txurl = "[PAID]"+"(https://tx.botdev.me/"+cur+"/"+txid+")"
let texwd='🎁 *New Instant Withdraw* 🎁\n\n✅ *Status:* '+txurl+'\n✅ *User Id:* `'+ctx.from.id+'`\n✅ Amount: *'+amot.toFixed(7)+' '+cur+'*\n\n🚀 *Bot* '+bot_username+'\n\n❤️ _Invite your friends and earn more_'



await bot.telegram.sendMessage(data.payment_channel,texwd,{parse_mode:'markdown',disable_web_page_preview:true})
}


   ctx.deleteMessage();
  
  let sss = ctx.update.callback_query.data.split(" ")[1]
  let nnn = ctx.update.callback_query.data.split(" ")[2]

let d = sss*1
let k = parseInt(nnn)
let dData = await db.collection('allUsers').find({userId: k}).toArray()
let wallet = dData[0].coinmail

var wdo = {
     amount: d+0.1,
     currency: cur,
     address: wallet,
     auto_confirm: 1
      }
 let wdp = await client.createWithdrawal(wdo)
 let status = wdp.status 
 if(status==1){
 let cpid = wdp.id
 let amont = wdp.amount
 ctx.replyWithMarkdown("✅* Withdrawal Requested*\nYour payment is being processed automatically right now!\n\n*Secured Payment ID:* \n"+cpid+"\n_You will receive TXID soon_"+"\n\n💳 *Transaction Details:* "+amont+" "+cur+" to the wallet\n"+"`"+wallet+"`")
 
 setTimeout(getwid, 300000, cpid,k)
 
 }

} catch (err) {
    sendError(err, ctx)
  }
})

bot.action(/refund [0-9]/, async ctx=>
  {
  try{
  
   ctx.deleteMessage();
  
  let sss = ctx.update.callback_query.data.split(" ")[1]
  let nnn = ctx.update.callback_query.data.split(" ")[2]

let d = sss*1
let k = parseInt(nnn)

let dbData = await db.collection('balance').find({userId: k}).toArray().catch((err) => sendError(err, ctx))

let bal = dbData[0].balance
let rem = bal+d*1
db.collection('balance').updateOne({userId: k}, {$set: {balance: rem}}, {upsert: true})

let texwd = "➕ *Withdrawal Refund*: +"+d+" TRX"
await bot.telegram.sendMessage(k,texwd,{parse_mode:'markdown'})

ctx.reply('Done')
 

  
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

async function mustJoin(ctx){
console.log(ctx)
  let msg = '<b>⛔️ You must Join our channels</b>\n'
  for(var ind in channels){
  var cha = channels[ind]
  msg+='\n'+cha
  }
  msg+='\n\n<b>Click 🟢 Joined to continue</b>'
  await ctx.replyWithHTML(msg, {
   reply_markup:{
   keyboard: [['🟢 Joined']],
   resize_keyboard: true
  }
  })
  }
   
 function starter (ctx) {
 ctx.replyWithMarkdown(
    '*🏠 Main Menu*',
    { reply_markup: { keyboard: [['💳 Balance'],['👫 Referral', '🎰 Bonus', 'Withdraw 💵'], ['📊 Stat', '🏧 Wallet']], resize_keyboard: true }})

   }


 


function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function sendError (err, ctx) {
  if (err.toString().includes('message is not modified')) {
    return
  }
  bot.telegram.sendMessage(data.admin, `Error From [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nError: ${err}`, { parse_mode: 'markdown' })
}

async function findUser(ctx){
let isInChannel= true;
for (let i = 0; i < channels.length; i++) {
const chat = channels[i];
console.log(chat)
let tgData = await bot.telegram.getChatMember(chat, ctx.from.id)
  console.log(tgData)
  const sub = ['creator','adminstrator','member'].includes(tgData.status)
  if (!sub) {
    isInChannel = false;
    break;
  }
}

console.log(isInChannel)
return isInChannel
}
