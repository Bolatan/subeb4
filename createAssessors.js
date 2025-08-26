const mongoose = require('mongoose');
const User = require('./models/User');

// This is the list of assessors you provided.
const assessors = [
  "BUSARI BALIQIS MODUPE",
  "RASAQ LATEEFAT AJIKE",
  "OLADAPO IYALODE",
  "BAKARE ADEBAYO ABRAHAM",
  "MUTHAIRU SULAIMON OLAREWAJU",
  "AKINTELURE BOLA JULIANAH",
  "ADAMOLEKUN ADEGOKE BENJAMIN",
  "OBASA ITUNNU",
  "EMMANUEL SAMSON ESEZOBOR",
  "OLAJIRE KAYODE",
  "AJAO OLALEKAN MUMINI",
  "EGBE JOY ELEMONYE",
  "AYOBIOJO SAMUEL",
  "Idowu Alani Adbul Taoreed",
  "Ajetunmobi Kehinde Hassan",
  "Oretolu Emmanuel",
  "ELELUBO JIMOH OJO",
  "OSUNDIPE OLAREWAJU",
  "FADIYA MATTHEW AYODEJI",
  "OSUNSANYA ADEFOLAHAN ADENIYI",
  "OJIGI TAIYE RICHARD",
  "RASAQ RASHHED OLAJIDE",
  "MRS. MAKINWA Y",
  "JOHN IDOWU",
  "MRS. SALAUDEEN BUNMI BAMIDELE",
  "MAKANJU KOLADE",
  "IKEKWEM IHEDI ARTHUR",
  "IDOWU ALANI ABDULTAOREED",
  "AJETOMOBI HASSAN KEHINDE",
  "ADEROHUNMU KAZEEM ADEKUNLE",
  "SALAMI OLAYINKA",
  "AKANDE BABATUNDE",
  "ADEBOWALE ADEYEMI",
  "THOMAS EMMANUEL GBETOYIN",
  "ALABI MICHAEL",
  "ANOFI LIASU OLALEKAN",
  "ZAKARIYA HAMDALLAT",
  "WAIDI AHMED OLATUNDE",
  "AJAYI ADEGAASI",
  "MRS. OLAREWAJU YEMISI",
  "JACOB EMMANUEL OLUMIDE",
  "HUNPATIN SENAYON MICHEAL",
  "FEYISETAN OLUWATOSIN FESTUS",
  "WUSU MATTHEW SEIDO",
  "OKOYA EMMANUEL OLUWASEUN",
  "OLABINTAN OPEYEMI OUWASEUN",
  "AMEEN AFEEZ",
  "ALBERT JAMES",
  "OTUSANYA ADEMOLA OTUNIYI",
  "OWOLOMOSHE LUKMAN OLALEKAN",
  "OLUFAWO OLUKINLE",
  "ADENIYI-ADELE OLUWATOYIN BAMIDELE",
  "TITILAYO ROTIMI YAKUBU",
  "OBALAKUN AKEEM",
  "OKUWA ABD'AZEEM ABIODUN",
  "OMOJUWA MICHAEL ADELEKE",
  "ODUYILE BEATRICE",
  "SALAAM YUSUF ADESEGUN",
  "DUYILE BEATRICE OLUWARANTI",
  "SUNMOLA BAMIDELE",
  "TIJANI AHMED ABIODUN",
  "ADEBISI ADEYEMI ABDULRAFIH",
  "FETUGA LOOKMAN ADEWUNMI",
  "OLOTU ABIODUN ADEGBITE",
  "OGUNDIPE TAOFEEK SEGUN",
  "FOWOWE OMOLEWA TEMILOLA",
  "OBANLA DADA",
  "ODUMOSU ISLAMIYAH ABOLORE",
  "FOWOSERE OLUWATOBI GAFAR",
  "ONIBEJU, TEMITOPE JIMOH",
  "JIMOH BABATUNDE ALIU",
  "OWODUNNI ABDULAHI OLUWADMILARE",
  "ADEMOLA ALADUSURU",
  "OBALAKUN AKEEM",
  "IPAYE OLAYINKA",
  "SANNI NOJEEM OLANREWAJU",
  "ADEBAYO AMOS TEMIDAYO",
  "OLAREWAJU ADENIKE BISOLA",
  "SALAUDEEN RASHEEDAT ADEBOLA",
  "ARINDE CLEMENT",
  "OLAOLUWA FATIMO ADEJUMOKE",
  "RABIU SIMBIAT MOJISOLA",
  "SALAU NURENI OLAMILEKAN",
  "OSAKUADE TOLULOPE JOSEPH",
  "BAKER MOHAMMED",
  "SALAMI MUBARAK ORIYOMI",
  "BADEJO ADEWALE",
  "FASIDA TOSIN",
  "OSENI IBRAHIM BAMIDELE",
  "INAKOJU GANIYU ODUNITAN",
  "MABUNMI OLUWASEGUN",
  "LAWAL RASHEED ORIYOMI",
  "ODEWABI ABIMBOLA IBUKUNOLU",
  "OLUKOYA NKECHI",
  "MR. OLUROMBI IBRAHIM K.",
  "ROTIMI SEUN TOPE",
  "DAVIES-RASAQ B. M.",
  "MRS. IDOWU GANIYAT O.",
  "MR. OLUROMBI IBRAHIM K.",
  "MISS AWOMOLO YETUNDE B.",
  "MR. OKEOWO ODUNTAN",
  "DADA ADELEKE OLUWAFEMI",
  "DOSUNMU ADEBIYI",
  "HASSAN AMIRAT ALABA",
  "OJO MICHAEL OLUSEGUN",
  "SERIKI LUKMAN",
  "APELOGUN SAMSON",
  "SOSANYA ADENIYI ALBERT",
  "AKANDE ADIGUN",
  "AKINWALE GABRIEL",
  "OLOYE ALABA OLUMIDE",
  "MUSTAPHA KAMOL AJANI",
  "AGBAJE DANIEL SEGUN",
  "OLATUNJI IBRAHIM",
  "ABASS OLUWAFEMI",
  "OLUSANYA BUKONLA",
  "WHENSU SAMUEL",
  "OLUBOWALE TOLULOPE IFEOLUWAPO",
  "ABDULAZEEZ MUJIDAT AFOLASHADE",
  "AJAYI ABIMBola AYOBAMI",
  "SOMEFUN ADESOLA AJARAT",
  "ANU JANET ITUNU",
  "YUSUF SULIAT TENIOLA",
  "ALABI NOIMOT BOLANLE",
  "ATITEBI RUKAYAT ADEBIMPE",
  "OGUNJIMI RASHIDAT ADEBANKE",
  "DARAMOLA TUNDE DADA",
  "TIJANI AFUSAT YETUNDE",
  "OLATIDOYE TAIWO",
  "OSINOWO OLUWASEUN",
  "ADEROHUNMU ADISA",
  "TITUS OLAMIDE BENJAMIN",
  "ONIYIDE ABENI RASHEEDAT",
  "OMOTOLA AYODELE SUNDAY",
  "SHONEYE AMED OMOLAJA",
  "ALIMI SUNKANMI",
  "OLUBODE EMILOLA OLUGBEMI",
  "ONITOLO AYOMIDE MISTURAT",
  "AFUYE BOSEDE REGINA",
  "IGE EMMANUEL BOLAJI",
  "TAIWO ADEFABI",
  "YUSU AMAMAT MOJISOLA",
  "OLAMIDE BOLAJI",
  "ADEGOKE TIJANI",
  "KAYODE FASUYI",
  "HENRY AGORO",
  "JIMOH TOSIN",
  "SANNI QUDUS",
  "AISHA ADAM BABANGIDA",
  "ADEKEYE JAMIU OLAWALE",
  "OJO EMMANUEL H O SLGEA",
  "OROGBEMI OLADOTUN OMOLADE",
  "FAGBOHUN ANUOLUWAPO ABEL",
  "FADASE OLUMUYIWA AKINYEMI",
  "ADEBAYO DAMILOLA DREGG",
  "LAWAL IBRAHIM OLAREWAJU",
  "EWUOSHO MICHEAL OLAREWAJU",
  "ALIU MUMUNI",
  "MORAKINYO OLAOLU SOLA",
  "OLADEJI FOLASHADE OLAMIDE",
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const temporaryPassword = 'password123';

// Function to generate username from full name
const generateUsername = (fullName) => {
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  if (!firstName || !lastName) {
    // Handle cases like "MRS. MAKINWA Y" or single names
    const sanitizedName = fullName.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return sanitizedName || `user${Math.floor(Math.random() * 1000)}`;
  }
  return `${firstName.charAt(0)}${lastName}`.toLowerCase();
};

const createAssessorUsers = async () => {
  try {
    for (const fullName of assessors) {
      const username = generateUsername(fullName);

      let user = await User.findOne({ username });

      if (user) {
        console.log(`User '${username}' already exists.`);
      } else {
        await User.create({
          username,
          password: temporaryPassword,
          role: 'assessor',
          passwordResetRequired: true, // Assuming this field will be added to the schema
        });
        console.log(`Assessor user '${username}' created successfully.`);
      }
    }
  } catch (error) {
    console.error('Error creating assessor users:', error);
  }
};

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB');
    await createAssessorUsers();
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
