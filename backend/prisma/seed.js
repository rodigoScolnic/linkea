import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";

const demoPassword = await bcrypt.hash("LinkeaDemo2026!", 12);

const demos = [
  { username:"demo_camila", email:"demo_camila@linkea.test", name:"Camila Torres", gender:"Femenino", age:27, city:"Buenos Aires", vocalRegister:"Soprano", experience:"Profesional", languages:["Español","Italiano","Inglés"], interests:["Ópera","Teatro","Viajes"], repertoire:["La traviata","Carmen","La bohème"], photo:"https://randomuser.me/api/portraits/women/44.jpg", bio:"Soprano, curiosa y apasionada por descubrir nuevos escenarios." },
  { username:"demo_mateo", email:"demo_mateo@linkea.test", name:"Mateo Rivas", gender:"Masculino", age:31, city:"Córdoba", vocalRegister:"Tenor", experience:"Semiprofesional", languages:["Español","Italiano"], interests:["Ópera","Cine","Senderismo"], repertoire:["L'elisir d'amore","Rigoletto"], photo:"https://randomuser.me/api/portraits/men/32.jpg", bio:"Tenor en formación avanzada. Disfruto compartir música y proyectos." },
  { username:"demo_valentina", email:"demo_valentina@linkea.test", name:"Valentina Suárez", gender:"Femenino", age:24, city:"Rosario", vocalRegister:"Mezzo", experience:"Estudiante", languages:["Español","Inglés"], interests:["Música","Literatura","Danza"], repertoire:["Carmen","Orfeo ed Euridice"], photo:"https://randomuser.me/api/portraits/women/68.jpg", bio:"Estudiante de canto, siempre buscando aprender algo nuevo." },
  { username:"demo_julian", email:"demo_julian@linkea.test", name:"Julián Ferreyra", gender:"Masculino", age:35, city:"La Plata", vocalRegister:"Barítono", experience:"Profesional", languages:["Español","Francés","Italiano"], interests:["Ópera","Fotografía","Gastronomía"], repertoire:["Don Giovanni","Le nozze di Figaro"], photo:"https://randomuser.me/api/portraits/men/75.jpg", bio:"Barítono. Me interesan los proyectos colaborativos y el repertorio clásico." },
  { username:"demo_sofia", email:"demo_sofia@linkea.test", name:"Sofía Benítez", gender:"Femenino", age:29, city:"Mendoza", vocalRegister:"Contralto", experience:"Amateur", languages:["Español","Portugués"], interests:["Coros","Naturaleza","Lectura"], repertoire:["Stabat Mater","Dido and Aeneas"], photo:"https://randomuser.me/api/portraits/women/12.jpg", bio:"Canto por amor a la música y a los encuentros que genera." },
  { username:"demo_tomas", email:"demo_tomas@linkea.test", name:"Tomás Acosta", gender:"Masculino", age:22, city:"Buenos Aires", vocalRegister:"Bajo", experience:"Estudiante", languages:["Español","Inglés"], interests:["Ópera","Composición","Videojuegos"], repertoire:["Las bodas de Fígaro","Don Pasquale"], photo:"https://randomuser.me/api/portraits/men/18.jpg", bio:"Bajo joven, estudiante de música y fan de los nuevos desafíos." },
  { username:"demo_lucia", email:"demo_lucia@linkea.test", name:"Lucía Molina", gender:"Femenino", age:33, city:"Mar del Plata", vocalRegister:"Soprano", experience:"Profesional", languages:["Español","Italiano","Alemán"], interests:["Ópera","Mar","Yoga"], repertoire:["La bohème","Die Zauberflöte"], photo:"https://randomuser.me/api/portraits/women/90.jpg", bio:"Soprano lírica. La música y el mar son mis dos lugares favoritos." },
  { username:"demo_bautista", email:"demo_bautista@linkea.test", name:"Bautista Herrera", gender:"Masculino", age:28, city:"Santa Fe", vocalRegister:"Tenor", experience:"Amateur", languages:["Español","Inglés"], interests:["Conciertos","Running","Teatro"], repertoire:["La fille du régiment","L'elisir d'amore"], photo:"https://randomuser.me/api/portraits/men/46.jpg", bio:"Tenor amateur con muchas ganas de conocer gente del ambiente." },
  { username:"demo_emilia", email:"demo_emilia@linkea.test", name:"Emilia Navarro", gender:"Femenino", age:26, city:"CABA", vocalRegister:"Mezzo", experience:"Semiprofesional", languages:["Español","Francés"], interests:["Ópera","Pintura","Museos"], repertoire:["Werther","Carmen"], photo:"https://randomuser.me/api/portraits/women/32.jpg", bio:"Mezzo en camino profesional. Amo el repertorio francés." },
  { username:"demo_felipe", email:"demo_felipe@linkea.test", name:"Felipe Castro", gender:"Masculino", age:39, city:"San Isidro", vocalRegister:"Barítono", experience:"Profesional", languages:["Español","Italiano","Inglés"], interests:["Ópera","Historia","Cocina"], repertoire:["Rigoletto","Il barbiere di Siviglia"], photo:"https://randomuser.me/api/portraits/men/64.jpg", bio:"Barítono con experiencia escénica y pasión por enseñar." },
  { username:"demo_martina", email:"demo_martina@linkea.test", name:"Martina López", gender:"Femenino", age:21, city:"Córdoba", vocalRegister:"Soprano", experience:"Estudiante", languages:["Español","Inglés"], interests:["Canto","Danza","Libros"], repertoire:["Die Zauberflöte","Gianni Schicchi"], photo:"https://randomuser.me/api/portraits/women/25.jpg", bio:"Estudiante de canto. Busco inspiración y compañeros musicales." },
  { username:"demo_nicolas", email:"demo_nicolas@linkea.test", name:"Nicolás Vega", gender:"Masculino", age:30, city:"Rosario", vocalRegister:"Bajo", experience:"Semiprofesional", languages:["Español","Portugués","Italiano"], interests:["Ópera","Ajedrez","Café"], repertoire:["Don Giovanni","Boris Godunov"], photo:"https://randomuser.me/api/portraits/men/22.jpg", bio:"Bajo, melómano y entusiasta de los ensambles vocales." },
  { username:"demo_abril", email:"demo_abril@linkea.test", name:"Abril Giménez", gender:"Femenino", age:37, city:"Neuquén", vocalRegister:"Contralto", experience:"Profesional", languages:["Español","Inglés","Italiano"], interests:["Música antigua","Montaña","Fotografía"], repertoire:["Orfeo ed Euridice","Dido and Aeneas"], photo:"https://randomuser.me/api/portraits/women/56.jpg", bio:"Contralto, amante de la música antigua y los paisajes patagónicos." },
  { username:"demo_santiago", email:"demo_santiago@linkea.test", name:"Santiago Paz", gender:"Masculino", age:25, city:"Buenos Aires", vocalRegister:"Tenor", experience:"Amateur", languages:["Español","Inglés"], interests:["Musicales","Ópera","Natación"], repertoire:["West Side Story","La traviata"], photo:"https://randomuser.me/api/portraits/men/11.jpg", bio:"Tenor amateur, disfruto tanto la ópera como el teatro musical." },
  { username:"demo_renata", email:"demo_renata@linkea.test", name:"Renata Silva", gender:"Femenino", age:32, city:"Salta", vocalRegister:"Mezzo", experience:"Profesional", languages:["Español","Portugués","Italiano"], interests:["Ópera","Folklore","Viajes"], repertoire:["Carmen","Samson et Dalila"], photo:"https://randomuser.me/api/portraits/women/79.jpg", bio:"Mezzo profesional. Me encanta explorar cruces entre estilos." },
  { username:"demo_benjamin", email:"demo_benjamin@linkea.test", name:"Benjamín Ortiz", gender:"Masculino", age:34, city:"Mendoza", vocalRegister:"Barítono", experience:"Semiprofesional", languages:["Español","Francés"], interests:["Ópera","Vino","Ciclismo"], repertoire:["Don Giovanni","La Cenerentola"], photo:"https://randomuser.me/api/portraits/men/83.jpg", bio:"Barítono, disfruto los escenarios y los proyectos independientes." },
  { username:"demo_josefina", email:"demo_josefina@linkea.test", name:"Josefina Ruiz", gender:"Femenino", age:28, city:"La Plata", vocalRegister:"Soprano", experience:"Semiprofesional", languages:["Español","Alemán","Italiano"], interests:["Ópera","Arquitectura","Cine"], repertoire:["Die Zauberflöte","La bohème"], photo:"https://randomuser.me/api/portraits/women/41.jpg", bio:"Soprano apasionada por Mozart y los espacios culturales." },
  { username:"demo_leonardo", email:"demo_leonardo@linkea.test", name:"Leonardo Méndez", gender:"Masculino", age:42, city:"Mar del Plata", vocalRegister:"Bajo", experience:"Profesional", languages:["Español","Italiano","Inglés"], interests:["Ópera","Navegación","Literatura"], repertoire:["Don Carlo","Faust"], photo:"https://randomuser.me/api/portraits/men/91.jpg", bio:"Bajo con trayectoria. Siempre abierto a nuevos encuentros artísticos." },
  { username:"demo_mora", email:"demo_mora@linkea.test", name:"Mora Cabrera", gender:"Femenino", age:23, city:"Santa Fe", vocalRegister:"Contralto", experience:"Estudiante", languages:["Español","Inglés"], interests:["Coro","Comedia musical","Piano"], repertoire:["Dido and Aeneas","Orfeo ed Euridice"], photo:"https://randomuser.me/api/portraits/women/5.jpg", bio:"Estudiante y contralto. Me encanta cantar en grupo." },
  { username:"demo_gabriel", email:"demo_gabriel@linkea.test", name:"Gabriel Domínguez", gender:"Masculino", age:27, city:"CABA", vocalRegister:"Tenor", experience:"Semiprofesional", languages:["Español","Italiano","Inglés"], interests:["Ópera","Fotografía","Viajes"], repertoire:["La traviata","L'elisir d'amore"], photo:"https://randomuser.me/api/portraits/men/57.jpg", bio:"Tenor en desarrollo, curioso por conocer nuevas voces y escenarios." }
];

const today = new Date();
for (const demo of demos) {
  const birthDate = new Date(Date.UTC(today.getUTCFullYear() - demo.age, 5, 15));
  const profile = {
    displayName: demo.name,
    bio: `PERFIL FICTICIO DE PRUEBA · ${demo.bio}`,
    birthDate,
    city: demo.city,
    vocalRegister: demo.vocalRegister,
    gender: demo.gender,
    languages: demo.languages,
    experience: demo.experience,
    repertoire: demo.repertoire,
    interests: demo.interests,
    photoUrl: demo.photo
  };
  await prisma.user.upsert({
    where: { username: demo.username },
    update: { email: demo.email, profile: { upsert: { update: profile, create: profile } } },
    create: {
      username: demo.username,
      email: demo.email,
      passwordHash: demoPassword,
      profile: { create: profile }
    }
  });
}
console.log(`Seed completado: ${demos.length} perfiles ficticios creados/actualizados.`);
await prisma.$disconnect();
