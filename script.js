import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, where, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyApb7A9mFmj1gq1poLS0vQxTWz2__CULGA",
  authDomain: "sera-business-hub.firebaseapp.com",
  projectId: "sera-business-hub",
  storageBucket: "sera-business-hub.firebasestorage.app",
  messagingSenderId: "323062656725",
  appId: "1:323062656725:web:35a2ae4ed6d4e9f6ed7c5c",
  measurementId: "G-54S5JPSCTP"
};

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), storage=getStorage(app), provider=new GoogleAuthProvider();
let currentUser=null, productsData=[], salesData=[], moduleData={}, unsubscribeProducts=null, unsubscribeSales=null, unsubscribeDue=null, unsubscribeBkash=null, unsubscribeNagad=null, unsubscribeSchoolQuestions=null, unsubscribeSchoolDocuments=null, unsubscribeComputer=null, unsubscribeSchoolStudents=null, unsubscribePrintOrders=null;
let settingsStatusKey="settingsSavedForUser", deleteAllStatusKey="";
let onlineEnabled=false,onlineDistrict="",onlineSettingsReady=Promise.resolve();
let onlineCatalogRequest=0;
const $=id=>document.getElementById(id);
const translations={
 bn:{
  appTitle:"সেরা বিজনেস হাব",login:"Gmail দিয়ে লগইন",logout:"লগআউট",dashboard:"ড্যাশবোর্ড",products:"পণ্য তালিকা",electronics:"ইলেকট্রনিক্স পণ্য",computer:"কম্পিউটার সার্ভিস",school:"স্কুল কলেজ",print:"কার্ড/ফটো প্রিন্ট",bkash:"বিকাশ এজেন্ট",nagad:"নগদ এজেন্ট",due:"বাকি খাতা",settings:"সেটিং",search:"অনুসন্ধান করুন",monthlyReport:"মাসিকের রিপোর্ট (PDF)",monthlySales:"মাসিক মোট বিক্রি",monthlyProfit:"মাসিক মোট লাভ",totalDue:"মোট বাকি",addNewItem:"নতুন আইটেম যোগ করুন",newProduct:"নতুন পণ্য",recentProducts:"সাম্প্রতিক পণ্য তালিকা",image:"ছবি",productName:"পণ্যের নাম",category:"ক্যাটাগরি",stock:"স্টক",buyPrice:"ক্রয়মূল্য",sellPrice:"বিক্রয়মূল্য",action:"অ্যাকশন",loginToView:"তথ্য দেখতে অনুগ্রহ করে লগইন করুন।",grandTotal:"সর্বমোট (Total)",addProduct:"পণ্য যোগ করুন",addService:"+ সার্ভিস যোগ করুন",customerService:"কাস্টমার/সার্ভিস",mobile:"মোবাইল নম্বর",serviceDetails:"সার্ভিসের বিবরণ",price:"মূল্য",save:"সেভ",addInfo:"+ তথ্য যোগ করুন",studentName:"শিক্ষার্থীর নাম",class:"শ্রেণি/ক্লাস",fee:"ফি",addOrder:"+ অর্ডার যোগ করুন",customerName:"কাস্টমারের নাম",orderType:"অর্ডারের ধরন (কার্ড/ফটো/প্রিন্ট)",quantity:"পরিমাণ",saveCustomerTransaction:"কাস্টমারের নম্বর / লেনদেন সংরক্ষণ",dueShort:"বাকি",paid:"পরিশোধ",dueAmount:"বাকি টাকা",note:"নোট",languageSettings:"ভাষা / Language",selectLanguage:"ভাষা নির্বাচন করুন",businessInfo:"ব্যবসার তথ্য",businessName:"ব্যবসার নাম",businessMobile:"ব্যবসার মোবাইল নম্বর",address:"ঠিকানা",saveSettings:"সেটিং সেভ করুন",phoneNumbers:"ফোন নম্বর",deleteAllTitle:"সব হিসাব ও ডাটা মুছুন",deleteAll:"সব ডাটা মুছুন",addNewProduct:"নতুন পণ্য যোগ করুন",productImage:"পণ্যের ছবি:",categoryExample:"ক্যাটাগরি (যেমন: ইলেকট্রনিক্স)",stockQuantity:"স্টক পরিমাণ",buyPriceCurrency:"ক্রয়মূল্য (৳)",sellPriceCurrency:"বিক্রয়মূল্য (৳)",add:"যোগ করুন",cancel:"বাতিল",sell:"বিক্রি",delete:"ডিলিট",addStock:"স্টক যোগ",noProducts:"কোনো পণ্য নেই।",noData:"কোনো তথ্য পাওয়া যায়নি।",noRecords:"কোনো তথ্য নেই।",noTransactions:"কোনো লেনদেন নেই।",name:"নাম",phone:"নম্বর",type:"ধরন",amount:"টাকা",status:"স্ট্যাটাস",date:"তারিখ",details:"বিবরণ",className:"শ্রেণি",orderQuantity:"পরিমাণ",deletePrompt:"ডাটা ডিলিট করবেন?",deleteProductPrompt:"পণ্যটি ডিলিট করতে চান?",stockPrompt:"কতটি স্টক যোগ করবেন?",stockEnded:"স্টক শেষ!",invalidStock:"সঠিক স্টক পরিমাণ লিখুন।",loginRequired:"এই অংশ ব্যবহার করতে আগে Gmail দিয়ে লগইন করুন!",loginFailed:"লগইন করা যায়নি: ",saveFailed:"ডাটা সেভ করতে সমস্যা হয়েছে: ",actionFailed:"কাজটি সম্পন্ন হয়নি: ",deleted:"পরিশোধিত",dueStatus:"বাকি",saveError:"সেভ করা যায়নি: ",bkashInfo:"এখানে নম্বর আলাদা করে সংরক্ষণ হবে। OTP verification ব্যবহার করতে Firebase Console-এ Phone Authentication চালু করতে হবে। এই ফর্ম নিজে থেকে bKash-এর আসল অ্যাকাউন্টের লেনদেন পড়বে না।",nagadInfo:"নম্বর ও লেনদেন আলাদাভাবে Firebase-এ সংরক্ষণ হবে। আসল Nagad account-এর transaction automatically পড়ার জন্য Nagad API/merchant access প্রয়োজন।",settingsPhoneHint:"bKash/Nagad নম্বর আপনার নিজের Firebase ডাটায় রাখা হবে। SMS OTP login/verification চালু করতে Firebase Authentication → Phone সেটিং করতে হবে।",deleteAllHint:"এই অ্যাকাউন্টের পণ্য, বিক্রি, লাভ, বাকি এবং অন্যান্য সংরক্ষিত হিসাব স্থায়ীভাবে মুছে যাবে। Gmail লগইন অ্যাকাউন্ট মুছবে না。",bkashNumber:"বিকাশ নম্বর",nagadNumber:"নগদ নম্বর",saveTransaction:"লেনদেন সেভ",bkashSummary:"বিকাশ হিসাব",nagadSummary:"নগদ হিসাব"
 },
 en:{
  appTitle:"Sera Business Hub",login:"Sign in with Gmail",logout:"Log out",dashboard:"Dashboard",products:"Product List",electronics:"Electronics Products",computer:"Computer Service",school:"School & College",print:"Card/Photo Printing",bkash:"bKash Agent",nagad:"Nagad Agent",due:"Due Ledger",settings:"Settings",search:"Search",monthlyReport:"Monthly Report (PDF)",monthlySales:"Total Monthly Sales",monthlyProfit:"Total Monthly Profit",totalDue:"Total Due",addNewItem:"Add New Item",newProduct:"New Product",recentProducts:"Recent Products",image:"Image",productName:"Product Name",category:"Category",stock:"Stock",buyPrice:"Buy Price",sellPrice:"Sell Price",action:"Action",loginToView:"Please log in to view data.",grandTotal:"Grand Total",addProduct:"Add Product",addService:"+ Add Service",customerService:"Customer/Service",mobile:"Mobile Number",serviceDetails:"Service Details",price:"Price",save:"Save",addInfo:"+ Add Information",studentName:"Student Name",class:"Class/Grade",fee:"Fee",addOrder:"+ Add Order",customerName:"Customer Name",orderType:"Order Type (Card/Photo/Print)",quantity:"Quantity",saveCustomerTransaction:"Save Customer Number / Transaction",dueShort:"Due",paid:"Paid",dueAmount:"Due Amount",note:"Note",languageSettings:"Language",selectLanguage:"Select language",businessInfo:"Business Information",businessName:"Business Name",businessMobile:"Business Phone Number",address:"Address",saveSettings:"Save Settings",phoneNumbers:"Phone Numbers",deleteAllTitle:"Delete All Records & Data",deleteAll:"Delete All Data",addNewProduct:"Add New Product",productImage:"Product Image:",categoryExample:"Category (e.g. Electronics)",stockQuantity:"Stock Quantity",buyPriceCurrency:"Buy Price (৳)",sellPriceCurrency:"Sell Price (৳)",add:"Add",cancel:"Cancel",sell:"Sell",delete:"Delete",addStock:"Add Stock",noProducts:"No products found.",noData:"No information found.",noRecords:"No records found.",noTransactions:"No transactions found.",name:"Name",phone:"Phone",type:"Type",amount:"Amount",status:"Status",date:"Date",details:"Details",className:"Class",orderQuantity:"Quantity",deletePrompt:"Delete this record?",deleteProductPrompt:"Delete this product?",stockPrompt:"How many units would you like to add?",stockEnded:"Out of stock!",invalidStock:"Enter a valid stock quantity.",loginRequired:"Please sign in with Gmail to use this feature.",loginFailed:"Could not sign in: ",saveFailed:"Could not save data: ",actionFailed:"Action failed: ",deleted:"Paid",dueStatus:"Due",saveError:"Could not save: ",bkashInfo:"This form stores the number separately. To use OTP verification, enable Phone Authentication in Firebase Console. This form does not read transactions from the actual bKash account.",nagadInfo:"Numbers and transactions are stored separately in Firebase. Reading transactions from the actual Nagad account requires Nagad API/merchant access.",settingsPhoneHint:"bKash/Nagad numbers are stored in your Firebase data. To enable SMS OTP login/verification, configure Firebase Authentication → Phone.",deleteAllHint:"This permanently deletes this account's products, sales, profit, dues, and other saved records. It does not delete the Gmail login account.",bkashNumber:"bKash Number",nagadNumber:"Nagad Number",saveTransaction:"Save Transaction",bkashSummary:"bKash Records",nagadSummary:"Nagad Records"
 }
};
Object.assign(translations.bn,{
 deleteAllHint:"এই অ্যাকাউন্টের পণ্য, বিক্রি, লাভ, বাকি এবং অন্যান্য সংরক্ষিত হিসাব স্থায়ীভাবে মুছে যাবে। Gmail লগইন অ্যাকাউন্ট মুছবে না।",
 noDues:"কোনো বাকি নেই।",settingsSaved:"সেটিং সফলভাবে সেভ হয়েছে।",deleteAllConfirm:"এই অ্যাকাউন্টের সব পণ্য, বিক্রি, লাভ, বাকি, স্কুলের ফর্ম, Word ফাইল এবং অন্যান্য সংরক্ষিত হিসাব স্থায়ীভাবে মুছে ফেলবেন? এই কাজটি আর ফিরিয়ে নেওয়া যাবে না।",
 deletingData:"ডাটা মুছে ফেলা হচ্ছে...",dataDeleted:"এই অ্যাকাউন্টের সব হিসাব ও ডাটা মুছে ফেলা হয়েছে।",deleteFailed:"সব ডাটা মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",deleteError:"ডাটা মুছতে সমস্যা হয়েছে: ",settingsSavedForUser:"লগইন করা ইউজারের ডাটা আলাদা Firebase account-এ সংরক্ষিত হচ্ছে।"
});
Object.assign(translations.en,{
 noDues:"No dues found.",settingsSaved:"Settings saved successfully.",deleteAllConfirm:"Permanently delete all products, sales, profit, dues, school forms, Word files, and other saved records for this account? This action cannot be undone.",
 deletingData:"Deleting data...",dataDeleted:"All records and data for this account have been deleted.",deleteFailed:"Could not delete all data. Please try again.",deleteError:"Could not delete data: ",settingsSavedForUser:"Data for the signed-in user is stored separately in Firebase."
});
Object.assign(translations.bn,{
 selectComputerService:"সার্ভিস নির্বাচন করুন",windowsInstall:"উইন্ডোজ ইন্সটল",softwareInstall:"সফটওয়্যার ইন্সটল",computerRepair:"কম্পিউটার মেরামত",hardwareUpgrade:"হার্ডওয়্যার / RAM / SSD আপগ্রেড",virusRemoval:"ভাইরাস পরিষ্কার",printerSetup:"প্রিন্টার সেটআপ",networkSetup:"নেটওয়ার্ক / ইন্টারনেট সেটআপ",dataRecovery:"ডাটা রিকভারি",typingPrinting:"টাইপিং / প্রিন্টিং",onlineApplication:"অনলাইন আবেদন",otherComputerService:"অন্যান্য"
});
Object.assign(translations.en,{
 selectComputerService:"Select a service",windowsInstall:"Windows Installation",softwareInstall:"Software Installation",computerRepair:"Computer Repair",hardwareUpgrade:"Hardware / RAM / SSD Upgrade",virusRemoval:"Virus Removal",printerSetup:"Printer Setup",networkSetup:"Network / Internet Setup",dataRecovery:"Data Recovery",typingPrinting:"Typing / Printing",onlineApplication:"Online Application",otherComputerService:"Other"
});
Object.assign(translations.bn,{
 documentPrint:"ডকুমেন্ট প্রিন্ট",documentPhotocopy:"ডকুমেন্ট ফটোকপি",idCardPhotocopy:"আইডি কার্ড ফটোকপি",colorPrint:"কালার",blackWhitePrint:"সাদা-কালো",nonPrint:"নন",pageCount:"পৃষ্ঠা সংখ্যা",totalPrice:"মোট মূল্য",printType:"রঙের ধরন",color:"কালার",bw:"সাদা-কালো",non:"নন",photoAllSizes:"ছবি প্রিন্ট — সব সাইজ",passportPhoto:"পাসপোর্ট সাইজ ছবি",photo3R:"৩R সাইজ ছবি",allPrint:"সব ধরনের প্রিন্ট"
});
Object.assign(translations.en,{
 documentPrint:"Document Printing",documentPhotocopy:"Document Photocopy",idCardPhotocopy:"ID Card Photocopy",colorPrint:"Color",blackWhitePrint:"Black and white",nonPrint:"Non-color",pageCount:"Number of pages",totalPrice:"Total price",printType:"Color type",color:"Color",bw:"Black and white",non:"Non-color",photoAllSizes:"Photo Printing — All Sizes",passportPhoto:"Passport Size Photo",photo3R:"3R Size Photo",allPrint:"All Print Services"
});
Object.assign(translations.bn,{
 studentInfo:"শিক্ষার্থীর তথ্য",schoolName:"স্কুল / কলেজের নাম",customQuestions:"নিজের প্রশ্ন যোগ করুন",questionName:"প্রশ্নের নাম",addQuestion:"প্রশ্ন যোগ করুন",wordDocument:"Word ফাইল প্রিন্ট হিসাব",pageRate:"প্রতি পৃষ্ঠার দাম",uploadSave:"আপলোড ও সেভ",fileName:"ফাইলের নাম",pages:"পৃষ্ঠা",total:"মোট",download:"ফাইল দেখুন",noDocuments:"কোনো Word ফাইল সেভ করা হয়নি।",uploading:"ফাইল আপলোড হচ্ছে...",fileSaved:"Word ফাইল সেভ হয়েছে।",fileError:"ফাইল আপলোড করা যায়নি: ",invalidWordFile:"শুধু .doc বা .docx ফাইল আপলোড করুন।",questionSaved:"প্রশ্ন যোগ হয়েছে।",removeQuestion:"প্রশ্ন মুছুন",question:"প্রশ্ন"
});
Object.assign(translations.en,{
 studentInfo:"Student Information",schoolName:"School / College Name",customQuestions:"Add Your Own Questions",questionName:"Question name",addQuestion:"Add Question",wordDocument:"Word File Printing",pageRate:"Price per page",uploadSave:"Upload and Save",fileName:"File name",pages:"Pages",total:"Total",download:"Open file",noDocuments:"No Word files saved.",uploading:"Uploading file...",fileSaved:"Word file saved.",fileError:"Could not upload file: ",invalidWordFile:"Upload only .doc or .docx files.",questionSaved:"Question added.",removeQuestion:"Remove question",question:"Question"
});
Object.assign(translations.bn,{savingFileDetails:"ফাইল আপলোড হয়েছে, হিসাব সেভ হচ্ছে..."});
Object.assign(translations.en,{savingFileDetails:"File uploaded, saving the record..."});
Object.assign(translations.bn,{storageBucketMissing:"Firebase Storage bucket পাওয়া যায়নি। Firebase Console-এ Storage চালু করে bucket-এর নাম app config-এর সাথে মিলিয়ে নিন।",uploadRetryExpired:"Storage আপলোডের retry limit শেষ হয়েছে। ইন্টারনেট ও Storage নিয়ম পরীক্ষা করে আবার চেষ্টা করুন।"});
Object.assign(translations.en,{storageBucketMissing:"Firebase Storage bucket was not found. Enable Storage in Firebase Console and make sure its name matches the app config.",uploadRetryExpired:"The Storage upload retry limit was reached. Check the internet connection and Storage rules, then try again."});
Object.assign(translations.bn,{
 appearanceSettings:"চেহারা",selectTheme:"থিম নির্বাচন করুন",lightMode:"লাইট মোড",darkMode:"ডার্ক মোড",nightMode:"নাইট মোড"
});
Object.assign(translations.en,{
 appearanceSettings:"Appearance",selectTheme:"Choose theme",lightMode:"Light mode",darkMode:"Dark mode",nightMode:"Night mode"
});
Object.assign(translations.bn,{
 businessManagement:"বিজনেস ম্যানেজমেন্ট",workspace:"ওয়ার্কস্পেস",secureWorkspace:"সুরক্ষিত ওয়ার্কস্পেস",today:"আজকের তারিখ",installApp:"অ্যাপ ইনস্টল",
 businessOverview:"বিজনেস ওভারভিউ",dashboardSubtitle:"আপনার ব্যবসার গুরুত্বপূর্ণ হিসাব, এক জায়গায়।",
 salesCaption:"বিক্রির সারসংক্ষেপ",profitCaption:"বিক্রি থেকে অর্জিত",dueCaption:"গ্রাহকের বকেয়া হিসাব",
 inventory:"ইনভেন্টরি",inventorySubtitle:"পণ্যের স্টক ও মূল্য এক নজরে দেখুন",
 inventoryHint:"আপনার পণ্যের স্টক ও মূল্য ব্যবস্থাপনা করুন",liveData:"লাইভ ডেটা"
});
Object.assign(translations.en,{
 businessManagement:"BUSINESS MANAGEMENT",workspace:"Workspace",secureWorkspace:"Secure workspace",today:"Today",installApp:"Install app",
 businessOverview:"BUSINESS OVERVIEW",dashboardSubtitle:"Your essential business numbers, all in one place.",
 salesCaption:"Sales summary",profitCaption:"Earned from sales",dueCaption:"Outstanding customer balance",
 inventory:"Inventory",inventorySubtitle:"Review your stock and pricing at a glance",
 inventoryHint:"Manage your product stock and pricing",liveData:"Live data"
});
Object.assign(translations.bn,{
 barcodeMenu:"বারকোড দাম",photoMenu:"পণ্যের ছবি",optionalBarcode:"বারকোড নম্বর (ঐচ্ছিক)",
 saveBarcode:"বারকোড সেট",barcodePrompt:"এই পণ্যের বারকোড নম্বর লিখুন:",
 barcodeRequired:"বারকোড নম্বর লিখুন।",barcodeDuplicate:"এই বারকোড অন্য পণ্যে ব্যবহৃত হয়েছে।",
 barcodeLocalFound:"আপনার পণ্য তালিকায় মিল পাওয়া গেছে।",
 barcodeNotInInventory:"আপনার পণ্য তালিকায় এই বারকোড নেই। দাম দেখতে পণ্যটি তালিকায় যোগ করে বারকোড সংরক্ষণ করুন।",
 savedSellPrice:"আপনার সংরক্ষিত বিক্রয়মূল্য",
 barcodeTitle:"বারকোড থেকে দাম খুঁজুন",barcodeDescription:"কোড স্ক্যান করে Google-এ পণ্যের দাম ও তথ্য দেখুন।",
 scanStart:"ক্যামেরা দিয়ে স্ক্যান",scanStop:"স্ক্যান বন্ধ",cameraHelp:"ক্যামেরা না চললে বারকোড নম্বর লিখুন।",
 cameraSecure:"ক্যামেরার জন্য HTTPS বা localhost-এ অ্যাপ খুলুন।",
 cameraUnsupported:"এই ব্রাউজারে স্বয়ংক্রিয় বারকোড স্ক্যান নেই। নম্বরটি লিখুন।",
 cameraNoFormats:"এই ব্রাউজারে সমর্থিত বারকোড ফরম্যাট নেই। নম্বরটি লিখুন।",
 cameraPermission:"ক্যামেরার অনুমতি দিন, তারপর আবার চেষ্টা করুন।",
 cameraNotFound:"কোনো ক্যামেরা পাওয়া যায়নি। বারকোড নম্বর লিখুন।",
 cameraError:"ক্যামেরা চালু হয়নি: ",cameraSearching:"বারকোড খোঁজা হচ্ছে...",
 cameraStopped:"স্ক্যান বন্ধ হয়েছে।",cameraResult:"বারকোড পাওয়া গেছে। নিচে Google ফলাফল খুলুন।",
 scanFailed:"বারকোড স্ক্যান করা যায়নি: ",barcodePlaceholder:"বারকোড নম্বর লিখুন",
 googlePriceSearch:"Google-এ দাম খুঁজুন",googleShopping:"Google Shopping",
 googleImages:"Google Images-এ ছবি দেখুন",googleProductDetails:"Google-এ পণ্যের তথ্য দেখুন",
 codeLabel:"বারকোড:",priceDisclaimer:"Google-এর ফলাফল অঞ্চল ও পণ্যভেদে ভিন্ন হতে পারে; দাম নিশ্চিত নয়।",
 photoTitle:"অনলাইনে পণ্যের ছবি",photoDescription:"বারকোড নম্বর দিয়ে Google Images-এ পণ্যের ছবি খুঁজুন।",
 photoSearch:"পণ্যের ছবি খুঁজুন",photoFromScanHint:"বারকোড স্ক্যান পেজে স্ক্যান করা নম্বর এখানে স্বয়ংক্রিয়ভাবে আসবে।"
});
Object.assign(translations.en,{
 barcodeMenu:"Barcode price",photoMenu:"Product photos",optionalBarcode:"Barcode number (optional)",
 saveBarcode:"Set barcode",barcodePrompt:"Enter the barcode number for this product:",
 barcodeRequired:"Enter a barcode number.",barcodeDuplicate:"This barcode is already assigned to another product.",
 barcodeLocalFound:"A match was found in your product list.",
 barcodeNotInInventory:"This barcode is not in your product list. Add the product and save its barcode to see your price.",
 savedSellPrice:"Your saved selling price",
 barcodeTitle:"Find a price by barcode",barcodeDescription:"Scan a code and search Google for product prices and details.",
 scanStart:"Scan with camera",scanStop:"Stop scanning",cameraHelp:"If the camera is unavailable, enter the barcode number.",
 cameraSecure:"Open the app on HTTPS or localhost to use the camera.",
 cameraUnsupported:"Automatic barcode scanning is not supported in this browser. Enter the code instead.",
 cameraNoFormats:"This browser has no supported barcode formats. Enter the code instead.",
 cameraPermission:"Allow camera access, then try again.",
 cameraNotFound:"No camera was found. Enter the barcode number instead.",
 cameraError:"Could not start the camera: ",cameraSearching:"Looking for a barcode...",
 cameraStopped:"Scanning stopped.",cameraResult:"Barcode detected. Open a Google result below.",
 scanFailed:"Could not scan the barcode: ",barcodePlaceholder:"Enter barcode number",
 googlePriceSearch:"Find price on Google",googleShopping:"Google Shopping",
 googleImages:"View photos on Google Images",googleProductDetails:"View product details on Google",
 codeLabel:"Barcode:",priceDisclaimer:"Google results vary by region and product; prices are not guaranteed.",
 photoTitle:"Product photos online",photoDescription:"Search Google Images for a product using its barcode.",
 photoSearch:"Find product photos",photoFromScanHint:"A code scanned on the barcode page will appear here automatically."
});
Object.assign(translations.bn,{
 onlineProductsMenu:"অনলাইন পণ্য",onlineCatalogTitle:"জেলা অনুযায়ী অনলাইন পণ্য",onlineCatalogDescription:"জেলা বেছে সেই এলাকার প্রকাশিত পণ্যের তালিকা দেখুন।",
 onlineSettingsTitle:"অনলাইন পণ্য তালিকা",onlinePublishToggle:"আমার পণ্য অনলাইনে দেখান",
 onlinePublishHint:"চালু করলে সবাই নির্বাচিত জেলার তালিকায় আপনার পণ্যের নাম, ছবি, দাম ও স্টক দেখতে পারবে।",
 selectBusinessDistrict:"আপনার ব্যবসার জেলা",selectDistrict:"জেলা নির্বাচন করুন",onlineChooseDistrict:"পণ্য দেখতে একটি জেলা নির্বাচন করুন।",
 onlineLoading:"পণ্য তালিকা লোড হচ্ছে...",onlineNoProducts:"এই জেলার কোনো অনলাইন পণ্য নেই।",
 onlineLoadError:"অনলাইন পণ্য লোড করা যায়নি: ",onlineFoundProducts:"পণ্য পাওয়া গেছে: {count}",
 onlinePublishError:"পণ্য অনলাইনে প্রকাশ করা যায়নি: ",
 onlineSettingsError:"সেটিং সেভ করা যায়নি: ",onlineSettingsLoadError:"অনলাইন সেটিং লোড করা যায়নি: ",
 onlineProductsPublished:"পণ্য অনলাইনে প্রকাশিত হয়েছে।",onlineProductsUnpublished:"পণ্য অনলাইন তালিকা থেকে সরানো হয়েছে।",
 onlineCatalogHint:"শুধু প্রকাশিত পণ্যের নাম, ছবি, বিক্রয়মূল্য ও স্টক দেখানো হয়।"
});
Object.assign(translations.en,{
 onlineProductsMenu:"Online products",onlineCatalogTitle:"Online products by district",onlineCatalogDescription:"Choose a district to see products published for that area.",
 onlineSettingsTitle:"Online product listing",onlinePublishToggle:"Show my products online",
 onlinePublishHint:"When enabled, anyone can see your product names, photos, prices, and stock in the selected district's list.",
 selectBusinessDistrict:"Your business district",selectDistrict:"Select a district",onlineChooseDistrict:"Choose a district to view products.",
 onlineLoading:"Loading products...",onlineNoProducts:"No online products are listed for this district.",
 onlineLoadError:"Could not load online products: ",onlineFoundProducts:"Products found: {count}",
 onlinePublishError:"Could not publish products online: ",
 onlineSettingsError:"Could not save settings: ",onlineSettingsLoadError:"Could not load online settings: ",
 onlineProductsPublished:"Products are now listed online.",onlineProductsUnpublished:"Products were removed from the online list.",
 onlineCatalogHint:"Only published product names, photos, selling prices, and stock are shown."
});
const bangladeshDistricts=[
 ["barguna","বরগুনা","Barguna"],["barishal","বরিশাল","Barishal"],["bhola","ভোলা","Bhola"],["jhalokati","ঝালকাঠি","Jhalokati"],["patuakhali","পটুয়াখালী","Patuakhali"],["pirojpur","পিরোজপুর","Pirojpur"],
 ["bandarban","বান্দরবান","Bandarban"],["brahmanbaria","ব্রাহ্মণবাড়িয়া","Brahmanbaria"],["chandpur","চাঁদপুর","Chandpur"],["chattogram","চট্টগ্রাম","Chattogram"],["cumilla","কুমিল্লা","Cumilla"],["coxsbazar","কক্সবাজার","Cox's Bazar"],["feni","ফেনী","Feni"],["khagrachhari","খাগড়াছড়ি","Khagrachhari"],["lakshmipur","লক্ষ্মীপুর","Lakshmipur"],["noakhali","নোয়াখালী","Noakhali"],["rangamati","রাঙামাটি","Rangamati"],
 ["dhaka","ঢাকা","Dhaka"],["faridpur","ফরিদপুর","Faridpur"],["gazipur","গাজীপুর","Gazipur"],["gopalganj","গোপালগঞ্জ","Gopalganj"],["kishoreganj","কিশোরগঞ্জ","Kishoreganj"],["madaripur","মাদারীপুর","Madaripur"],["manikganj","মানিকগঞ্জ","Manikganj"],["munshiganj","মুন্সিগঞ্জ","Munshiganj"],["narayanganj","নারায়ণগঞ্জ","Narayanganj"],["narsingdi","নরসিংদী","Narsingdi"],["rajbari","রাজবাড়ী","Rajbari"],["shariatpur","শরীয়তপুর","Shariatpur"],["tangail","টাঙ্গাইল","Tangail"],
 ["bagerhat","বাগেরহাট","Bagerhat"],["chuadanga","চুয়াডাঙ্গা","Chuadanga"],["jashore","যশোর","Jashore"],["jhenaidah","ঝিনাইদহ","Jhenaidah"],["khulna","খুলনা","Khulna"],["kushtia","কুষ্টিয়া","Kushtia"],["magura","মাগুরা","Magura"],["meherpur","মেহেরপুর","Meherpur"],["narail","নড়াইল","Narail"],["satkhira","সাতক্ষীরা","Satkhira"],
 ["jamalpur","জামালপুর","Jamalpur"],["mymensingh","ময়মনসিংহ","Mymensingh"],["netrokona","নেত্রকোনা","Netrokona"],["sherpur","শেরপুর","Sherpur"],
 ["bogura","বগুড়া","Bogura"],["chapainawabganj","চাঁপাইনবাবগঞ্জ","Chapainawabganj"],["joypurhat","জয়পুরহাট","Joypurhat"],["naogaon","নওগাঁ","Naogaon"],["natore","নাটোর","Natore"],["pabna","পাবনা","Pabna"],["rajshahi","রাজশাহী","Rajshahi"],["sirajganj","সিরাজগঞ্জ","Sirajganj"],
 ["dinajpur","দিনাজপুর","Dinajpur"],["gaibandha","গাইবান্ধা","Gaibandha"],["kurigram","কুড়িগ্রাম","Kurigram"],["lalmonirhat","লালমনিরহাট","Lalmonirhat"],["nilphamari","নীলফামারী","Nilphamari"],["panchagarh","পঞ্চগড়","Panchagarh"],["rangpur","রংপুর","Rangpur"],["thakurgaon","ঠাকুরগাঁও","Thakurgaon"],
 ["habiganj","হবিগঞ্জ","Habiganj"],["moulvibazar","মৌলভীবাজার","Moulvibazar"],["sunamganj","সুনামগঞ্জ","Sunamganj"],["sylhet","সিলেট","Sylhet"]
].map(([value,bn,en])=>({value,bn,en}));
const barcodeVideo=$("barcode-video"),barcodeCameraStatus=$("barcode-camera-status"),barcodeStartBtn=$("barcode-start-btn"),barcodeStopBtn=$("barcode-stop-btn");
const barcodePriceForm=$("barcode-price-form"),barcodePriceInput=$("barcode-price-input"),productPhotoForm=$("product-photo-form"),productPhotoInput=$("product-photo-input");
let barcodeStream=null,barcodeDetector=null,barcodeFrame=null,barcodeScanning=false,lastScannedBarcode="";
function findInventoryProduct(code){
 const normalized=normalizeBarcode(code);
 return productsData.find(product=>product.barcode&&normalizeBarcode(product.barcode)===normalized);
}
function renderOnlineProducts(products){
 const container=$("online-products-list");
 container.replaceChildren();
 products.forEach(product=>{
  const card=document.createElement("article");
  card.className="online-product-card";
  if(typeof product.img==="string"&&/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(product.img)){
   const image=document.createElement("img");
   image.className="online-product-image";
   image.src=product.img;
   image.alt=product.name||"";
   card.appendChild(image);
  }
  const info=document.createElement("div");
  info.className="online-product-info";
  const name=document.createElement("h3");
  name.textContent=product.name||"";
  info.appendChild(name);
  if(product.category){
   const category=document.createElement("p");
   category.className="online-product-category";
   category.textContent=product.category;
   info.appendChild(category);
  }
  const price=Number(product.sellPrice),stock=Number(product.stock);
  const priceText=document.createElement("strong");
  priceText.className="online-product-price";
  priceText.textContent="৳"+(Number.isFinite(price)?price.toLocaleString(language==="en"?"en-US":"bn-BD"):"0");
  const stockText=document.createElement("span");
  stockText.className="online-product-stock";
  stockText.textContent=`${t("stock")}: ${Number.isFinite(stock)?stock:0}`;
  info.append(priceText,stockText);
  card.appendChild(info);
  container.appendChild(card);
 });
}
async function loadOnlineProducts(district){
 const status=$("online-products-status"),request=++onlineCatalogRequest;
 $("online-products-list").replaceChildren();
 if(!district){status.textContent=t("onlineChooseDistrict");return}
 status.textContent=t("onlineLoading");
 try{
  const snapshot=await getDocs(query(collection(db,"onlineProducts"),where("district","==",district)));
  if(request!==onlineCatalogRequest)return;
  const products=snapshot.docs.map(item=>({id:item.id,...item.data()}));
  renderOnlineProducts(products);
  status.textContent=products.length?t("onlineFoundProducts").replace("{count}",String(products.length)):t("onlineNoProducts");
 }catch(error){
  if(request!==onlineCatalogRequest)return;
  status.textContent=t("onlineLoadError")+error.message;
 }
}
function updateBarcodeInventoryResult(code){
 const product=findInventoryProduct(code),status=$("barcode-inventory-status"),result=$("barcode-inventory-product"),image=$("barcode-local-image");
 status.hidden=false;result.hidden=!product;
 if(!product){status.textContent=t("barcodeNotInInventory");image.removeAttribute("src");image.hidden=true;return}
 status.textContent=t("barcodeLocalFound");
 $("barcode-local-name").textContent=product.name||"";
 $("barcode-local-meta").textContent=[product.category,`${product.stock??0} ${t("stock")}`].filter(Boolean).join(" · ");
 const price=Number(product.sellPrice);
 $("barcode-local-price").textContent="৳"+(Number.isFinite(price)?price.toLocaleString(language==="en"?"en-US":"bn-BD"):"0");
 image.alt=product.name||"";
 image.hidden=!product.img;
 if(product.img)image.src=product.img;else image.removeAttribute("src");
}
function googleBarcodeUrl(code,type){
 const query=encodeURIComponent(type==="price"?`${code} price`:code);
 if(type==="images")return`https://www.google.com/search?tbm=isch&q=${query}`;
 if(type==="shopping")return`https://www.google.com/search?tbm=shop&q=${query}`;
 return`https://www.google.com/search?q=${query}`;
}
function showProductPhotoSearch(value){
 const code=value.trim();if(!code)return false;
 lastScannedBarcode=code;
 productPhotoInput.value=code;
 $("product-photo-result-code").textContent=code;
 $("product-google-images-link").href=googleBarcodeUrl(code,"images");
 $("product-google-details-link").href=googleBarcodeUrl(code,"details");
 const product=findInventoryProduct(code),localResult=$("product-local-photo"),image=$("product-local-image");
 localResult.hidden=!product;
 if(product){
  $("product-local-name").textContent=product.name||"";
  $("product-local-meta").textContent=[product.category,`৳${product.sellPrice??0}`].filter(Boolean).join(" · ");
  image.alt=product.name||"";
  image.hidden=!product.img;
  if(product.img)image.src=product.img;else image.removeAttribute("src");
 }else image.removeAttribute("src");
 $("product-photo-results").hidden=false;
 return true;
}
function showBarcodeSearch(value){
 const code=value.trim();if(!code)return false;
 lastScannedBarcode=code;
 barcodePriceInput.value=code;
 $("barcode-price-result-code").textContent=code;
 $("barcode-google-price-link").href=googleBarcodeUrl(code,"price");
 $("barcode-google-shopping-link").href=googleBarcodeUrl(code,"shopping");
 $("barcode-google-images-link").href=googleBarcodeUrl(code,"images");
 $("barcode-price-results").hidden=false;
 updateBarcodeInventoryResult(code);
 barcodeCameraStatus.textContent=t("cameraResult");
 showProductPhotoSearch(code);
 return true;
}
function stopBarcodeScanner(updateStatus=true){
 barcodeScanning=false;
 if(barcodeFrame!==null)cancelAnimationFrame(barcodeFrame);
 barcodeFrame=null;
 if(barcodeStream)barcodeStream.getTracks().forEach(track=>track.stop());
 barcodeStream=null;barcodeDetector=null;
 barcodeVideo.srcObject=null;barcodeVideo.hidden=true;
 barcodeStartBtn.hidden=false;barcodeStopBtn.hidden=true;
 if(updateStatus)barcodeCameraStatus.textContent=t("cameraStopped");
}
async function scanBarcodeFrame(){
 if(!barcodeScanning)return;
 if(barcodeVideo.readyState>=2){
  try{
   const detections=await barcodeDetector.detect(barcodeVideo);
   if(!barcodeScanning)return;
   const code=detections.find(result=>result.rawValue)?.rawValue;
   if(code){stopBarcodeScanner(false);showBarcodeSearch(code);return}
  }catch(error){
   stopBarcodeScanner(false);barcodeCameraStatus.textContent=t("scanFailed")+error.message;return;
  }
 }
 if(barcodeScanning)barcodeFrame=requestAnimationFrame(scanBarcodeFrame);
}
async function startBarcodeScanner(){
 if(!window.isSecureContext){barcodeCameraStatus.textContent=t("cameraSecure");return}
 if(!navigator.mediaDevices?.getUserMedia||!window.BarcodeDetector?.getSupportedFormats){barcodeCameraStatus.textContent=t("cameraUnsupported");return}
 barcodeCameraStatus.textContent=t("cameraSearching");
 try{
  const supportedFormats=await window.BarcodeDetector.getSupportedFormats();
  const formats=supportedFormats.filter(format=>["code_128","code_39","code_93","codabar","ean_13","ean_8","itf","upc_a","upc_e"].includes(format));
  if(!formats.length){barcodeCameraStatus.textContent=t("cameraNoFormats");return}
  barcodeDetector=new window.BarcodeDetector({formats});
  barcodeStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"}}});
  barcodeVideo.srcObject=barcodeStream;barcodeVideo.hidden=false;
  await barcodeVideo.play();
  barcodeScanning=true;barcodeStartBtn.hidden=true;barcodeStopBtn.hidden=false;
  barcodeCameraStatus.textContent=t("cameraSearching");
  scanBarcodeFrame();
 }catch(error){
  stopBarcodeScanner(false);
  barcodeCameraStatus.textContent=error.name==="NotAllowedError"||error.name==="SecurityError"
   ?t("cameraPermission")
   :error.name==="NotFoundError"?t("cameraNotFound"):t("cameraError")+error.message;
 }
}
barcodeStartBtn.addEventListener("click",startBarcodeScanner);
barcodeStopBtn.addEventListener("click",()=>stopBarcodeScanner());
barcodePriceForm.addEventListener("submit",event=>{event.preventDefault();showBarcodeSearch(barcodePriceInput.value)});
productPhotoForm.addEventListener("submit",event=>{event.preventDefault();showProductPhotoSearch(productPhotoInput.value)});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&barcodeScanning)stopBarcodeScanner()});
window.addEventListener("pagehide",()=>stopBarcodeScanner(false));
let language=localStorage.getItem("sera-language")==="en"?"en":"bn";
const storedTheme=localStorage.getItem("sera-theme");
let theme=storedTheme==="dark"||storedTheme==="night"?storedTheme:"light";
function t(key){return translations[language][key]||translations.bn[key]||key}
function renderDistrictOptions(){
 ["online-publish-district","online-district-filter"].forEach(id=>{
  const select=$(id);if(!select)return;
  const selected=select.value;
  select.innerHTML=`<option value="">${escapeHtml(t("selectDistrict"))}</option>`+bangladeshDistricts.map(district=>`<option value="${district.value}">${escapeHtml(district[language])}</option>`).join("");
  if(bangladeshDistricts.some(district=>district.value===selected))select.value=selected;
 });
}
function applyTheme(){
 document.body.dataset.theme=theme;
 $("theme-select").value=theme;
}
function applyLanguage(){
 document.documentElement.lang=language;
 document.title=t("appTitle");
 document.querySelectorAll("[data-i18n]").forEach(node=>{const key=node.dataset.i18n;if(translations[language][key])node.textContent=t(key)});
 document.querySelectorAll("[data-i18n-placeholder]").forEach(node=>{node.placeholder=t(node.dataset.i18nPlaceholder)});
 renderDistrictOptions();
 const businessDate=$("business-date");
 if(businessDate)businessDate.textContent=new Intl.DateTimeFormat(language==="en"?"en-GB":"bn-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Dhaka"}).format(new Date());
 const selector=$("language-select");if(selector)selector.value=language;
 if($("settings-status").textContent)$("settings-status").textContent=t(settingsStatusKey);
 if(deleteAllStatusKey)$("delete-all-data-status").textContent=t(deleteAllStatusKey);
 if(currentUser)renderDashboardTable(productsData);
 else tableBody.innerHTML=`<tr><td colspan="7" class="center">${t("loginToView")}</td></tr>`;
 renderProductPages();renderCachedModules();updateComputerPrice();
}
const loginBtn=$("login-btn"),logoutBtn=$("logout-btn"),userProfile=$("user-profile"),userName=$("user-name"),userPhoto=$("user-photo");
const modal=$("modal"),addBtn=$("add-btn"),closeModalBtn=$("close-modal"),form=$("add-product-form"),tableBody=$("product-tbody"),downloadPdfBtn=$("download-pdf-btn");
const productCategoryInput=$("p-category");
const languageSelect=$("language-select");
let presetProductCategory="";
applyTheme();
applyLanguage();
languageSelect.addEventListener("change",()=>{language=languageSelect.value==="en"?"en":"bn";localStorage.setItem("sera-language",language);applyLanguage()});
$("online-publish-enabled").addEventListener("change",e=>{$("online-publish-district").disabled=!e.target.checked});
$("online-district-filter").addEventListener("change",()=>loadOnlineProducts($("online-district-filter").value));
$("theme-select").addEventListener("change",()=>{theme=$("theme-select").value;localStorage.setItem("sera-theme",theme);applyTheme()});
$("cs-color").addEventListener("change",updateComputerPrice);
$("cs-qty").addEventListener("input",updateComputerPrice);
 $("cs-name").addEventListener("change",updateComputerPrice);
updateComputerPrice();
["document-pages","document-page-rate"].forEach(id=>$(id).addEventListener("input",updateSchoolDocumentTotal));
updateSchoolDocumentTotal();

loginBtn.addEventListener("click",async()=>{try{await signInWithPopup(auth,provider)}catch(e){alert(t("loginFailed")+e.message)}});
logoutBtn.addEventListener("click",()=>signOut(auth));

onAuthStateChanged(auth,user=>{
  currentUser=user;
  if(user){
    loginBtn.style.display="none"; userProfile.style.display="flex"; userName.textContent=user.displayName||user.email||"ইউজার"; userPhoto.src=user.photoURL||"https://via.placeholder.com/35";
    onlineSettingsReady=loadSettings();
    onlineSettingsReady.catch(error=>{console.error("Could not load online settings:",error);settingsStatusKey="";$("settings-status").textContent=t("onlineSettingsLoadError")+error.message});
    loadUserData(); loadAllModules();
  }else{
    onlineEnabled=false;onlineDistrict="";onlineSettingsReady=Promise.resolve();
    $("online-publish-enabled").checked=false;$("online-publish-district").value="";$("online-publish-district").disabled=true;
    loginBtn.style.display="block"; userProfile.style.display="none"; tableBody.innerHTML=`<tr><td colspan="7" class="center">${t("loginToView")}</td></tr>`;
    moduleData={};
    $("school-list").innerHTML="";$("school-questions-list").innerHTML="";$("school-custom-fields").innerHTML="";$("school-documents-list").innerHTML="";$("school-documents-status").textContent="";
    clearModuleListeners();
  }
});

function requireLogin(){if(!currentUser){alert(t("loginRequired"));return false}return true}
function convertBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function onlineProductRef(uid,productId){return doc(db,"onlineProducts",`${uid}_${productId}`)}
function onlineProductData(product,uid,district){
 return{ownerUid:uid,sourceProductId:product.id,district,name:product.name||"",category:product.category||"",sellPrice:+product.sellPrice||0,stock:+product.stock||0,img:product.img||"",createdAt:product.createdAt||"",updatedAt:new Date().toISOString()};
}
async function publishOnlineProduct(product){
 if(!onlineEnabled)return;
 if(!onlineDistrict)throw new Error(t("selectBusinessDistrict"));
 const batch=writeBatch(db);
 batch.set(onlineProductRef(currentUser.uid,product.id),onlineProductData(product,currentUser.uid,onlineDistrict));
 await batch.commit();
}
async function deleteOnlineListings(uid){
 const snapshot=await getDocs(query(collection(db,"onlineProducts"),where("ownerUid","==",uid)));
 for(let index=0;index<snapshot.docs.length;index+=500){
  const batch=writeBatch(db);
  snapshot.docs.slice(index,index+500).forEach(item=>batch.delete(item.ref));
  await batch.commit();
 }
}
async function deleteOnlineListing(uid,productId){
 const snapshot=await getDocs(query(collection(db,"onlineProducts"),where("ownerUid","==",uid)));
 const matches=snapshot.docs.filter(item=>item.data().sourceProductId===productId);
 for(let index=0;index<matches.length;index+=500){
  const batch=writeBatch(db);
  matches.slice(index,index+500).forEach(item=>batch.delete(item.ref));
  await batch.commit();
 }
}
async function syncOnlineListings(uid,enabled,district){
 if(!enabled){await deleteOnlineListings(uid);return}
 if(!district)throw new Error(t("selectBusinessDistrict"));
 const snapshot=await getDocs(query(collection(db,"products"),where("uid","==",uid)));
 const products=snapshot.docs.map(item=>({id:item.id,...item.data()}));
 for(let index=0;index<products.length;index+=500){
  const batch=writeBatch(db);
  products.slice(index,index+500).forEach(product=>{
   batch.set(onlineProductRef(uid,product.id),onlineProductData(product,uid,district));
  });
  await batch.commit();
 }
 const published=await getDocs(query(collection(db,"onlineProducts"),where("ownerUid","==",uid)));
 const productIds=new Set(products.map(product=>product.id));
 const stale=published.docs.filter(item=>!productIds.has(item.data().sourceProductId));
 for(let index=0;index<stale.length;index+=500){
  const batch=writeBatch(db);
  stale.slice(index,index+500).forEach(item=>batch.delete(item.ref));
  await batch.commit();
 }
}
async function saveBusinessSettings(data){
 const settingsQuery=query(collection(db,"businessSettings"),where("uid","==",currentUser.uid));
 const snapshot=await getDocs(settingsQuery);
 const value={...data,uid:currentUser.uid};
 if(snapshot.empty)await addDoc(collection(db,"businessSettings"),{...value,createdAt:new Date().toISOString()});
 else await updateDoc(snapshot.docs[0].ref,value);
}

function openProductModal(category=""){
 if(!requireLogin())return;
 if(presetProductCategory&&productCategoryInput.value===presetProductCategory)productCategoryInput.value="";
 presetProductCategory=category;
 productCategoryInput.readOnly=Boolean(category);
 if(category)productCategoryInput.value=category;
 modal.style.display="flex";
}
function closeProductModal(){
 modal.style.display="none";
 productCategoryInput.readOnly=false;
}
addBtn.onclick=()=>openProductModal();
document.querySelectorAll(".open-add").forEach(b=>b.onclick=()=>openProductModal(b.closest("#page-electronics")?"ইলেকট্রনিক্স":""));
closeModalBtn.onclick=closeProductModal;
window.addEventListener("click",e=>{if(e.target===modal)closeProductModal()});

form.addEventListener("submit",async e=>{
 e.preventDefault(); if(!requireLogin())return;
 try{
  await onlineSettingsReady;
  const file=$("p-image").files[0];let img="";
  if(file)img=await convertBase64(file);
  const category=presetProductCategory||productCategoryInput.value.trim(),name=$("p-name").value.trim();
  const barcode=normalizeBarcode($("p-barcode").value);
  if(barcode&&productsData.some(product=>normalizeBarcode(product.barcode)===barcode))return alert(t("barcodeDuplicate"));
  const product={uid:currentUser.uid,name,category,barcode,productType:presetProductCategory||isElectronicsProduct({category,name})?"electronics":"general",stock:+$("p-stock").value||0,buyPrice:+$("p-buy-price").value||0,sellPrice:+$("p-sell-price").value||0,img,createdAt:new Date().toISOString()};
  const added=await addDoc(collection(db,"products"),product);
  if(onlineEnabled){
   try{await publishOnlineProduct({id:added.id,...product})}
   catch(error){alert(t("onlinePublishError")+error.message)}
  }
  form.reset();presetProductCategory="";closeProductModal();
 }catch(e){alert(t("saveFailed")+e.message)}
});

function loadUserData(){
 const qp=query(collection(db,"products"),where("uid","==",currentUser.uid));
 if(unsubscribeProducts)unsubscribeProducts();
 unsubscribeProducts=onSnapshot(qp,snap=>{
  productsData=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderDashboardTable(productsData); renderProductPages(); updateCategoryPages(); renderTotals();
   if(lastScannedBarcode){updateBarcodeInventoryResult(lastScannedBarcode);showProductPhotoSearch(lastScannedBarcode)}
 });
 const qs=query(collection(db,"sales"),where("uid","==",currentUser.uid));
 if(unsubscribeSales)unsubscribeSales();
 unsubscribeSales=onSnapshot(qs,snap=>{
  salesData=snap.docs.map(d=>d.data());
  let ms=0,mp=0; snap.forEach(d=>{const s=d.data();ms+=+s.sellPrice||0;mp+=+s.profit||0});
  $("total-sales-val").textContent="৳"+ms;$("total-profit-val").textContent="৳"+mp;
 });
}
function renderDashboardTable(list){
 tableBody.innerHTML="";
 if(!list.length){tableBody.innerHTML=`<tr><td colspan="7" class="center">${t("noProducts")}</td></tr>`;return}
 list.slice(0,20).forEach(p=>tableBody.appendChild(productRow(p)));
}
function productRow(p){
 const tr=document.createElement("tr");
 tr.innerHTML=`<td>${p.img?`<img src="${p.img}" class="product-img">`:"<i class='fa-solid fa-image'></i>"}</td>
 <td><strong>${escapeHtml(p.name)}</strong></td><td>${escapeHtml(p.category)}</td><td>${p.stock}</td><td>৳${p.buyPrice}</td><td>৳${p.sellPrice}</td>
 <td><button class="small-btn success sell-btn" data-id="${p.id}">${t("sell")}</button> <button class="small-btn danger del-btn" data-id="${p.id}">${t("delete")}</button> <button class="small-btn stock-btn" data-id="${p.id}">${t("addStock")}</button> <button class="small-btn barcode-btn" data-id="${p.id}">${t("saveBarcode")}</button></td>`;
 return tr;
}
function renderTotals(){
 let stock=0,buy=0,sell=0;productsData.forEach(p=>{stock+=+p.stock||0;buy=(+p.buyPrice||0)*(+p.stock||0)+buy;sell=(+p.sellPrice||0)*(+p.stock||0)+sell});
 $("total-stock").innerHTML=`<strong>${stock}</strong>`;$("total-buy-price").innerHTML=`<strong>৳${buy}</strong>`;$("total-sell-price").innerHTML=`<strong>৳${sell}</strong>`;
}
document.addEventListener("click",async e=>{
 const button=e.target.closest(".sell-btn, .del-btn, .stock-btn, .barcode-btn");if(!button)return;
 const id=button.dataset.id;if(!id||!requireLogin())return;const p=productsData.find(x=>x.id===id);if(!p)return;
 try{
  await onlineSettingsReady;
  if(button.classList.contains("barcode-btn")){
   const value=prompt(t("barcodePrompt"),p.barcode||"");
   if(value===null)return;
   const barcode=normalizeBarcode(value);
   if(!barcode)return alert(t("barcodeRequired"));
   if(productsData.some(product=>product.id!==id&&normalizeBarcode(product.barcode)===barcode))return alert(t("barcodeDuplicate"));
   await updateDoc(doc(db,"products",id),{barcode});
   return;
  }
  if(button.classList.contains("sell-btn")){if((+p.stock||0)<=0)return alert(t("stockEnded"));const stock=(+p.stock||0)-1;await updateDoc(doc(db,"products",id),{stock});await addDoc(collection(db,"sales"),{uid:currentUser.uid,productId:id,productName:p.name,buyPrice:p.buyPrice,sellPrice:p.sellPrice,profit:(+p.sellPrice||0)-(+p.buyPrice||0),date:new Date().toISOString()});await publishOnlineProduct({...p,stock})}
  if(button.classList.contains("del-btn")&&confirm(t("deleteProductPrompt"))){await deleteDoc(doc(db,"products",id));if(onlineEnabled)await deleteOnlineListing(currentUser.uid,id)}
  if(button.classList.contains("stock-btn")){
   const quantity=prompt(t("stockPrompt"));
   if(quantity===null)return;
   const amount=Number(quantity);
   if(!Number.isFinite(amount)||amount<=0)return alert(t("invalidStock"));
   const stock=(+p.stock||0)+amount;
   await updateDoc(doc(db,"products",id),{stock});
   await publishOnlineProduct({...p,stock});
  }
 }catch(err){alert(t("actionFailed")+err.message)}
});

function renderProductPages(){
 renderCards("all-products",productsData.filter(p=>!isElectronicsProduct(p)));
 renderCards("electronics-products",productsData.filter(isElectronicsProduct));
}
function isElectronicsProduct(product){return product.productType==="electronics"||/electronics|ইলেকট্রনিক্স|electronic|টিভি|মোবাইল|ফ্রিজ|ইলেকট্রিক/i.test(`${product.category||""} ${product.name||""}`)}
function renderCards(id,list){
 const box=$(id);if(!box)return;
 if(!list.length){box.innerHTML=`<p class="center">${t("noData")}</p>`;return}
 box.innerHTML=`<table class="data-table"><thead><tr><th>${t("image")}</th><th>${t("name")}</th><th>${t("category")}</th><th>${t("stock")}</th><th>${t("buyPrice")}</th><th>${t("sellPrice")}</th><th>${t("action")}</th></tr></thead><tbody></tbody></table>`;
 const tb=box.querySelector("tbody");list.forEach(p=>tb.appendChild(productRow(p)));
}
function updateCategoryPages(){renderProductPages()}

function clearModuleListeners(){
 [unsubscribeProducts,unsubscribeSales,unsubscribeDue,unsubscribeBkash,unsubscribeNagad,unsubscribeSchoolQuestions,unsubscribeSchoolDocuments,unsubscribeComputer,unsubscribeSchoolStudents,unsubscribePrintOrders].forEach(u=>{if(u)u()});
 unsubscribeProducts=unsubscribeSales=unsubscribeDue=unsubscribeBkash=unsubscribeNagad=unsubscribeSchoolQuestions=unsubscribeSchoolDocuments=unsubscribeComputer=unsubscribeSchoolStudents=unsubscribePrintOrders=null;
}

async function saveCollection(name,data){if(!requireLogin())return;try{await addDoc(collection(db,name),{...data,uid:currentUser.uid,createdAt:new Date().toISOString()})}catch(e){alert(t("saveError")+e.message)}}

$("computer-form").addEventListener("submit",e=>{e.preventDefault();const pageBased=isPageBasedComputerService($("cs-name").value);saveCollection("computerServices",{name:$("cs-name").value,type:pageBased?$("cs-color").value:"",qty:pageBased?(+$("cs-qty").value||1):1,details:$("cs-details").value,price:+$("cs-price").value||0}).then(()=>{e.target.reset();updateComputerPrice()})});
$("school-form").addEventListener("submit",e=>{
 e.preventDefault();
 if(!requireLogin())return;
 const answers={};
 document.querySelectorAll("#school-custom-fields [data-question-id]").forEach(input=>{answers[input.dataset.questionId]=input.value.trim()});
 addDoc(collection(db,"schoolStudents"),{uid:currentUser.uid,schoolName:$("school-name").value.trim(),name:$("student-name").value.trim(),phone:cleanPhone($("student-phone").value),className:$("student-class").value,fee:+$("student-fee").value||0,answers,createdAt:new Date().toISOString()}).then(()=>e.target.reset()).catch(error=>alert(t("saveError")+error.message));
});
$("school-question-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!requireLogin())return;
 const question=$("school-question-input").value.trim();if(!question)return;
 try{await addDoc(collection(db,"schoolFormQuestions"),{uid:currentUser.uid,question,createdAt:new Date().toISOString()});e.target.reset()}
 catch(error){alert(t("saveError")+error.message)}
});
$("school-custom-fields").addEventListener("input",e=>{if(e.target.matches("[data-question-id]"))e.target.required=false});
$("school-word-file").addEventListener("change",e=>{if(e.target.files[0])$("document-file-name").value=e.target.files[0].name});
$("school-document-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!requireLogin())return;
 const file=$("school-word-file").files[0];
 if(!file)return;
 if(!/\.docx?$/i.test(file.name)){alert(t("invalidWordFile"));return}
 const fileName=$("document-file-name").value.trim();
 if(!fileName){$("document-file-name").value="";$("document-file-name").reportValidity();return}
 const button=e.submitter||e.target.querySelector('button[type="submit"],button:not([type])'),progress=$("school-documents-progress");button.disabled=true;progress.hidden=false;progress.value=0;$("school-documents-status").textContent=t("uploading")+" 0%";
 const safeName=file.name.replace(/[^\w.-]/g,"_"),path=`schoolDocuments/${currentUser.uid}/${Date.now()}_${safeName}`,fileRef=ref(storage,path);
 let uploaded=false;
 try{
  const uploadTask=uploadBytesResumable(fileRef,file,{contentType:file.type||"application/octet-stream"});
  let lastStatusUpdate=0;
  await new Promise((resolve,reject)=>uploadTask.on("state_changed",snapshot=>{
   const percentage=snapshot.totalBytes?Math.min(100,snapshot.bytesTransferred/snapshot.totalBytes*100):100;progress.value=percentage;
   const now=Date.now();
   if(now-lastStatusUpdate>=1000||percentage===100){
    const transferred=snapshot.totalBytes>=1048576?(snapshot.bytesTransferred/1048576).toFixed(1)+" / "+(snapshot.totalBytes/1048576).toFixed(1)+" MB":snapshot.bytesTransferred.toLocaleString()+" / "+snapshot.totalBytes.toLocaleString()+" bytes";
    $("school-documents-status").textContent=t("uploading")+" "+percentage.toFixed(1)+"% ("+transferred+")";lastStatusUpdate=now;
   }
  },reject,resolve));
  uploaded=true;
  $("school-documents-status").textContent=t("savingFileDetails");
  const fileUrl=await getDownloadURL(uploadTask.snapshot.ref);
  await addDoc(collection(db,"schoolDocuments"),{uid:currentUser.uid,schoolName:$("document-school-name").value.trim(),fileName,storagePath:path,fileUrl,pages:+$("document-pages").value,pricePerPage:+$("document-page-rate").value,totalPrice:+$("document-total-price").value,createdAt:new Date().toISOString()});
  e.target.reset();updateSchoolDocumentTotal();$("school-documents-status").textContent=t("fileSaved");
 }catch(error){
  let message=error.code==="storage/bucket-not-found"?t("storageBucketMissing"):error.code==="storage/retry-limit-exceeded"?t("uploadRetryExpired"):error.message;
  if(uploaded){try{await deleteObject(fileRef)}catch(cleanupError){message+=` (${cleanupError.message})`}}
  $("school-documents-status").textContent=t("fileError")+message;
 }
 finally{button.disabled=false;progress.hidden=true}
});
$("print-form").addEventListener("submit",e=>{e.preventDefault();saveCollection("printOrders",{name:$("print-name").value,phone:cleanPhone($("print-phone").value),type:$("print-type").value,qty:+$("print-qty").value||1,price:+$("print-price").value||0}).then(()=>e.target.reset())});

$("bkash-form").addEventListener("submit",e=>{e.preventDefault();saveCollection("bkashTransactions",{name:$("bkash-name").value,phone:cleanPhone($("bkash-phone").value),type:$("bkash-type").value,amount:+$("bkash-amount").value||0,note:$("bkash-note").value}).then(()=>e.target.reset())});
$("nagad-form").addEventListener("submit",e=>{e.preventDefault();saveCollection("nagadTransactions",{name:$("nagad-name").value,phone:cleanPhone($("nagad-phone").value),type:$("nagad-type").value,amount:+$("nagad-amount").value||0,note:$("nagad-note").value}).then(()=>e.target.reset())});
$("due-form").addEventListener("submit",e=>{e.preventDefault();saveCollection("dueLedger",{name:$("due-name").value,phone:cleanPhone($("due-phone").value),amount:+$("due-amount").value||0,status:$("due-status").value,note:$("due-note").value}).then(()=>e.target.reset())});

function loadAllModules(){
 unsubscribeComputer=listenAndRender("computerServices","computer-list",["name","details","type","qty","price"]);
 unsubscribeSchoolStudents=listenAndRender("schoolStudents","school-list",["schoolName","name","phone","className","fee"]);
 unsubscribePrintOrders=listenAndRender("printOrders","print-list",["name","phone","type","qty","price"]);
 if(unsubscribeBkash)unsubscribeBkash(); if(unsubscribeNagad)unsubscribeNagad(); if(unsubscribeDue)unsubscribeDue();
 if(unsubscribeSchoolQuestions)unsubscribeSchoolQuestions();if(unsubscribeSchoolDocuments)unsubscribeSchoolDocuments();
 unsubscribeSchoolQuestions=onSnapshot(query(collection(db,"schoolFormQuestions"),where("uid","==",currentUser.uid)),snapshot=>{
  moduleData.schoolQuestions=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderSchoolQuestions();renderSchoolFormFields();renderSchoolStudents();
 });
 unsubscribeSchoolDocuments=onSnapshot(query(collection(db,"schoolDocuments"),where("uid","==",currentUser.uid)),snapshot=>{
  moduleData.schoolDocuments=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderSchoolDocuments();
 });
 const qB=query(collection(db,"bkashTransactions"),where("uid","==",currentUser.uid));unsubscribeBkash=onSnapshot(qB,s=>{moduleData.bkash=s.docs.map(d=>({id:d.id,...d.data()}));renderAgent("bkash-list",moduleData.bkash,"bkashTransactions");});
 const qN=query(collection(db,"nagadTransactions"),where("uid","==",currentUser.uid));unsubscribeNagad=onSnapshot(qN,s=>{moduleData.nagad=s.docs.map(d=>({id:d.id,...d.data()}));renderAgent("nagad-list",moduleData.nagad,"nagadTransactions");});
 const qD=query(collection(db,"dueLedger"),where("uid","==",currentUser.uid));unsubscribeDue=onSnapshot(qD,s=>{moduleData.due=s.docs.map(d=>({id:d.id,...d.data()}));renderDue(moduleData.due);let total=moduleData.due.filter(x=>x.status!=="paid").reduce((n,x)=>n+(+x.amount||0),0);$("total-due-val").textContent="৳"+total;});
}
function listenAndRender(coll,id,fields){
 const q=query(collection(db,coll),where("uid","==",currentUser.uid));return onSnapshot(q,s=>{moduleData[coll]=s.docs.map(d=>({id:d.id,...d.data()}));if(coll==="schoolStudents")renderSchoolStudents();else renderGeneric(id,moduleData[coll],coll,fields)});
}
function renderCachedModules(){
 if(moduleData.computerServices)renderGeneric("computer-list",moduleData.computerServices,"computerServices",["name","details","type","qty","price"]);
 if(moduleData.schoolStudents)renderSchoolStudents();
 if(moduleData.schoolQuestions){renderSchoolQuestions();renderSchoolFormFields()}
 if(moduleData.schoolDocuments)renderSchoolDocuments();
 if(moduleData.printOrders)renderGeneric("print-list",moduleData.printOrders,"printOrders",["name","phone","type","qty","price"]);
 if(moduleData.bkash)renderAgent("bkash-list",moduleData.bkash,"bkashTransactions");
 if(moduleData.nagad)renderAgent("nagad-list",moduleData.nagad,"nagadTransactions");
 if(moduleData.due)renderDue(moduleData.due);
}
function renderSchoolFormFields(){
 const box=$("school-custom-fields");box.innerHTML="";
 (moduleData.schoolQuestions||[]).forEach(item=>{
  const input=document.createElement("input");input.dataset.questionId=item.id;input.placeholder=item.question;input.setAttribute("aria-label",item.question);box.appendChild(input);
 });
}
function renderSchoolQuestions(){
 const box=$("school-questions-list"),questions=moduleData.schoolQuestions||[];
 if(!questions.length){box.innerHTML=`<p class="center">${t("noRecords")}</p>`;return}
 box.innerHTML=`<ul>${questions.map(q=>`<li>${escapeHtml(q.question)} <button type="button" class="small-btn danger" data-school-question-id="${q.id}">${t("removeQuestion")}</button></li>`).join("")}</ul>`;
}
function renderSchoolStudents(){
 const questions=moduleData.schoolQuestions||[],students=moduleData.schoolStudents||[],box=$("school-list");
 if(!students.length){box.innerHTML=`<p class="center">${t("noRecords")}</p>`;return}
 const fields=[["schoolName",t("schoolName")],["name",t("studentName")],["phone",t("phone")],["className",t("class")],["fee",t("fee")],...questions.map(q=>[q.id,q.question])];
 box.innerHTML=`<table class="data-table"><thead><tr>${fields.map(([,label])=>`<th>${escapeHtml(label)}</th>`).join("")}<th>${t("action")}</th></tr></thead><tbody>${students.map(student=>`<tr>${fields.map(([key])=>`<td>${escapeHtml(student.answers?.[key]??student[key]??"")}</td>`).join("")}<td><button class="small-btn danger" data-coll="schoolStudents" data-id="${student.id}">${t("delete")}</button></td></tr>`).join("")}</tbody></table>`;
}
function renderSchoolDocuments(){
 const box=$("school-documents-list"),documents=moduleData.schoolDocuments||[];
 if(!documents.length){box.innerHTML=`<p class="center">${t("noDocuments")}</p>`;return}
 box.innerHTML=`<table class="data-table"><thead><tr><th>${t("schoolName")}</th><th>${t("fileName")}</th><th>${t("pages")}</th><th>${t("pageRate")}</th><th>${t("total")}</th><th>${t("action")}</th></tr></thead><tbody>${documents.map(file=>`<tr><td>${escapeHtml(file.schoolName)}</td><td>${renderDocumentLink(file)}</td><td>${file.pages}</td><td>৳${file.pricePerPage}</td><td>৳${file.totalPrice}</td><td><button class="small-btn danger" data-coll="schoolDocuments" data-id="${file.id}" data-storage-path="${escapeHtml(file.storagePath)}">${t("delete")}</button></td></tr>`).join("")}</tbody></table>`;
}
function renderDocumentLink(file){
 try{const url=new URL(file.fileUrl);return url.protocol==="https:"?`<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener">${escapeHtml(file.fileName)}</a>`:escapeHtml(file.fileName)}
 catch{return escapeHtml(file.fileName)}
}
function renderGeneric(id,a,coll,fields){
 const box=$(id);if(!a.length){box.innerHTML=`<p class="center">${t("noRecords")}</p>`;return}
 box.innerHTML=`<table class="data-table"><thead><tr>${fields.map(f=>`<th>${label(f,coll)}</th>`).join("")}<th>${t("action")}</th></tr></thead><tbody>${a.map(x=>`<tr>${fields.map(f=>`<td>${escapeHtml(coll==="computerServices"&&f==="type"?(x.type==="color"?t("color"):x.type==="bw"?t("bw"):x.type==="non"?t("non"):x[f]??""):x[f]??"")}</td>`).join("")}<td><button class="small-btn danger" data-coll="${coll}" data-id="${x.id}">${t("delete")}</button></td></tr>`).join("")}</tbody></table>`;
}
function renderAgent(id,a,coll){
 const box=$(id);if(!a.length){box.innerHTML=`<p class="center">${t("noTransactions")}</p>`;return}
 box.innerHTML=`<table class="data-table"><thead><tr><th>${t("date")}</th><th>${t("name")}</th><th>${t("phone")}</th><th>${t("type")}</th><th>${t("amount")}</th><th>${t("note")}</th><th>${t("action")}</th></tr></thead><tbody>${a.sort((x,y)=>String(y.createdAt).localeCompare(String(x.createdAt))).map(x=>`<tr><td>${formatDate(x.createdAt)}</td><td>${escapeHtml(x.name||"")}</td><td>${escapeHtml(x.phone||"")}</td><td>${escapeHtml(x.type||"")}</td><td>৳${x.amount||0}</td><td>${escapeHtml(x.note||"")}</td><td><button class="small-btn danger" data-coll="${coll}" data-id="${x.id}">${t("delete")}</button></td></tr>`).join("")}</tbody></table>`;
}
function renderDue(a){
 const box=$("due-list");if(!a.length){box.innerHTML=`<p class="center">${t("noDues")}</p>`;return}
 box.innerHTML=`<table class="data-table"><thead><tr><th>${t("name")}</th><th>${t("phone")}</th><th>${t("amount")}</th><th>${t("status")}</th><th>${t("note")}</th><th>${t("action")}</th></tr></thead><tbody>${a.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.phone)}</td><td>৳${x.amount||0}</td><td>${x.status==="paid"?t("paid"):t("dueStatus")}</td><td>${escapeHtml(x.note||"")}</td><td><button class="small-btn danger" data-coll="dueLedger" data-id="${x.id}">${t("delete")}</button></td></tr>`).join("")}</tbody></table>`;
}
document.addEventListener("click",async e=>{
 const button=e.target.closest(".small-btn.danger");if(!button)return;
 try{
  if(button.dataset.schoolQuestionId){
   if(confirm(t("deletePrompt")))await deleteDoc(doc(db,"schoolFormQuestions",button.dataset.schoolQuestionId));
   return;
  }
  if(!button.dataset.coll||!confirm(t("deletePrompt")))return;
  if(button.dataset.coll==="schoolDocuments"&&button.dataset.storagePath)await deleteObject(ref(storage,button.dataset.storagePath));
  await deleteDoc(doc(db,button.dataset.coll,button.dataset.id));
 }catch(err){alert(t("actionFailed")+err.message)}
});

function label(x,coll){if(coll==="computerServices"&&x==="type")return t("printType");return({name:t("name"),schoolName:t("schoolName"),phone:t("phone"),details:t("details"),price:t("price"),className:t("className"),fee:t("fee"),type:t("type"),qty:t("orderQuantity")}[x]||x)}
function isPageBasedComputerService(name){return /Printing|Photocopy|Typing and Printing|All Print/.test(name)}
function updateComputerPrice(){
 const pageBased=isPageBasedComputerService($("cs-name").value),colorSelect=$("cs-color"),quantityInput=$("cs-qty"),priceInput=$("cs-price");
 colorSelect.hidden=!pageBased;quantityInput.hidden=!pageBased;priceInput.readOnly=pageBased;
 priceInput.placeholder=t(pageBased?"totalPrice":"price");
 if(pageBased){
  const qty=Number(quantityInput.value),rate=colorSelect.value==="color"?10:5;
  priceInput.value=Number.isInteger(qty)&&qty>0?qty*rate:"";
 }
}
function updateSchoolDocumentTotal(){
 const pages=Number($("document-pages").value),rate=Number($("document-page-rate").value);
 $("document-total-price").value=Number.isInteger(pages)&&pages>0&&Number.isFinite(rate)&&rate>=0?pages*rate:"";
}
function cleanPhone(v){return v.replace(/[^\d+]/g,"")}
function normalizeBarcode(v){return String(v??"").replace(/[\s-]/g,"").toUpperCase()}
function formatDate(v){try{return new Date(v).toLocaleString(language==="en"?"en-US":"bn-BD")}catch{return v||""}}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("settings-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!requireLogin())return;
 try{
  await onlineSettingsReady;
  const previous={onlineEnabled,onlineDistrict};
  const enabled=$("online-publish-enabled").checked,district=$("online-publish-district").value||onlineDistrict;
  if(enabled&&!district){alert(t("selectBusinessDistrict"));return}
  const data={businessName:$("business-name").value,businessPhone:cleanPhone($("business-phone").value),businessAddress:$("business-address").value,onlineEnabled:enabled,onlineDistrict:district};
  await saveBusinessSettings(data);
  try{
   if(enabled)await syncOnlineListings(currentUser.uid,true,district);
   else if(previous.onlineEnabled)await syncOnlineListings(currentUser.uid,false,"");
  }catch(error){
   try{
    await saveBusinessSettings({...data,onlineEnabled:previous.onlineEnabled,onlineDistrict:previous.onlineDistrict});
    if(previous.onlineEnabled)await syncOnlineListings(currentUser.uid,true,previous.onlineDistrict);
    else if(enabled)await deleteOnlineListings(currentUser.uid);
    onlineEnabled=previous.onlineEnabled;onlineDistrict=previous.onlineDistrict;
    $("online-publish-enabled").checked=onlineEnabled;$("online-publish-district").value=onlineDistrict;$("online-publish-district").disabled=!onlineEnabled;
    settingsStatusKey="";$("settings-status").textContent=t("onlinePublishError")+error.message;
   }catch(rollbackError){
    console.error("Could not restore online listings after a failed settings save:",rollbackError);
    settingsStatusKey="";$("settings-status").textContent=t("onlinePublishError")+error.message+" "+t("onlineSettingsError")+rollbackError.message;
   }
   return;
  }
  onlineEnabled=enabled;onlineDistrict=district;onlineSettingsReady=Promise.resolve();
  settingsStatusKey=enabled?"onlineProductsPublished":"onlineProductsUnpublished";
  $("settings-status").textContent=t(settingsStatusKey);
 }catch(error){
  settingsStatusKey="";$("settings-status").textContent=t("onlineSettingsError")+error.message;
  alert(t("onlineSettingsError")+error.message);
 }
});
$("delete-all-data-btn").addEventListener("click",async e=>{
 if(!requireLogin())return;
 if(!confirm(t("deleteAllConfirm")))return;
 const button=e.currentTarget,status=$("delete-all-data-status");
 button.disabled=true;deleteAllStatusKey="deletingData";status.textContent=t(deleteAllStatusKey);
 try{
  if(onlineEnabled)await deleteOnlineListings(currentUser.uid);
  const collections=["products","sales","dueLedger","bkashTransactions","nagadTransactions","computerServices","schoolStudents","schoolFormQuestions","schoolDocuments","printOrders","businessSettings"];
  for(const name of collections){
   const snapshot=await getDocs(query(collection(db,name),where("uid","==",currentUser.uid)));
   if(name==="schoolDocuments"){
    for(const item of snapshot.docs){const filePath=item.data().storagePath;if(filePath)await deleteObject(ref(storage,filePath))}
   }
   for(let index=0;index<snapshot.docs.length;index+=500){
    const batch=writeBatch(db);
    snapshot.docs.slice(index,index+500).forEach(item=>batch.delete(item.ref));
    await batch.commit();
   }
  }
  $("business-name").value="";$("business-phone").value="";$("business-address").value="";
  onlineEnabled=false;onlineDistrict="";onlineSettingsReady=Promise.resolve();
  $("online-publish-enabled").checked=false;$("online-publish-district").value="";$("online-publish-district").disabled=true;
  deleteAllStatusKey="dataDeleted";status.textContent=t(deleteAllStatusKey);
 }catch(error){
  deleteAllStatusKey="deleteFailed";status.textContent=t(deleteAllStatusKey);
  alert(t("deleteError")+error.message);
 }finally{button.disabled=false}
});
async function loadSettings(){
 const q=query(collection(db,"businessSettings"),where("uid","==",currentUser.uid));const s=await getDocs(q);
 if(!s.empty){
  const x=s.docs[0].data();
  $("business-name").value=x.businessName||"";$("business-phone").value=x.businessPhone||"";$("business-address").value=x.businessAddress||"";
  onlineEnabled=Boolean(x.onlineEnabled);onlineDistrict=bangladeshDistricts.some(district=>district.value===x.onlineDistrict)?x.onlineDistrict:"";
 }else{
  $("business-name").value="";$("business-phone").value="";$("business-address").value="";
  onlineEnabled=false;onlineDistrict="";
 }
 $("online-publish-enabled").checked=onlineEnabled;
 $("online-publish-district").value=onlineDistrict;
 $("online-publish-district").disabled=!onlineEnabled;
 settingsStatusKey="settingsSavedForUser";$("settings-status").textContent=t(settingsStatusKey);
}

document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",e=>{e.preventDefault();showPage(item.dataset.page)}));
function showPage(page){
 if(page!=="barcode"&&barcodeScanning)stopBarcodeScanner();
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const p=$("page-"+page);if(p)p.classList.add("active");
 if(page==="product-photos"&&lastScannedBarcode)showProductPhotoSearch(lastScannedBarcode);
}
showPage("dashboard");

$("search-input").addEventListener("input",e=>{
 const q=e.target.value.toLowerCase().trim();if(!q){renderDashboardTable(productsData);return}
 renderDashboardTable(productsData.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q)));
});

downloadPdfBtn.addEventListener("click",()=>{
 if(!requireLogin())return;const {jsPDF}=window.jspdf, pdf=new jsPDF();
 pdf.setFontSize(18);pdf.text("Sera Business Hub - Monthly Sales Report",14,20);
 pdf.setFontSize(11);pdf.text(`User Name: ${currentUser.displayName||currentUser.email}`,14,28);pdf.text(`Report Date: ${new Date().toLocaleDateString()}`,14,34);
 let totalSales=0,totalProfit=0;const rows=salesData.map((s,i)=>{totalSales+=+s.sellPrice||0;totalProfit+=+s.profit||0;return[i+1,s.productName,new Date(s.date).toLocaleDateString(),`Tk ${s.buyPrice}`,`Tk ${s.sellPrice}`,`Tk ${s.profit}`]});
 pdf.autoTable({startY:40,head:[["#","Product Name","Date","Buy Price","Sell Price","Profit"]],body:rows});
 const y=pdf.lastAutoTable?.finalY||50;pdf.text(`Total Sales Amount: Tk ${totalSales}`,14,y+10);pdf.text(`Total Profit Amount: Tk ${totalProfit}`,14,y+17);
 pdf.save(`Monthly_Report_${new Date().getMonth()+1}_${new Date().getFullYear()}.pdf`);
});
