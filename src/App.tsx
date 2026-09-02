import { useState, useMemo, useRef, useEffect } from "react";
import * as L from "leaflet";
import emailjs from "@emailjs/browser";
import "leaflet/dist/leaflet.css";
import certificateImg from "./assets/certificate/certificate.jpg";
import posterInterstellar from "./assets/posters/interstellar.jpg";
import posterSpidermanBrandNewDay from "./assets/posters/spiderman-brand-new-day.jpg";
import posterSpidermanAcrossSpiderverse from "./assets/posters/spiderman-across-the-spiderverse.jpg";
import posterMammaMia from "./assets/posters/mamma-mia.jpg";
import posterMandalorianGrogu from "./assets/posters/mandalorian-and-grogu.jpg";
import posterZootopia2 from "./assets/posters/zootopia-2.jpg";
import posterScream7 from "./assets/posters/scream-7.jpg";
import track1 from "./assets/music/t1-kubik-lda.mp3";
import track2 from "./assets/music/t2-stateside.mp3";
import track3 from "./assets/music/t3-ryadom-s-toboy.mp3";
import track4 from "./assets/music/t4-ma-meilleure-ennemie.mp3";
import track5 from "./assets/music/t5-vals.mp3";
import track6 from "./assets/music/t6-ufo-luv.mp3";

// ── Constants ─────────────────────────────────────────────────────────────────

const _now = new Date();
const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
const SPECIAL_DATE = "2026-06-03";

// Quest map: 4 real places in Almaty, coordinates confirmed via Google Places.
// `photos` stays undefined until real photos are added — the UI shows a nice
// placeholder in the meantime.
interface QuestPlace {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  memory: string;
  radius?: number; // tap-zone radius in meters — big buildings (malls) get a
                    // large radius so the whole building is tappable, not just
                    // an exact pixel over the coordinate. Defaults to 45m.
  photos?: string[]; // TODO: import real photos and assign them here, e.g. photos: [pic1, pic2, pic3]
  videos?: string[]; // same idea, for video clips — shown in the same gallery as photos, videos: [clip1, clip2]
}
// Media for each place lives in /public/media/<id>/ as plain static files
// (photo-01.jpg, photo-02.jpg, …, video-01.mp4, …) — referenced by path
// string rather than imported, since these are large originals we want
// served as-is rather than run through Vite's asset pipeline.
function placeMedia(id: string, photoCount: number, videoCount = 0) {
  return {
    photos: Array.from({ length: photoCount }, (_, i) => `/media/${id}/photo-${String(i + 1).padStart(2, "0")}.jpg`),
    videos: Array.from({ length: videoCount }, (_, i) => `/media/${id}/video-${String(i + 1).padStart(2, "0")}.mp4`),
  };
}

const QUEST_PLACES: QuestPlace[] = [
  { id: "opencinema", name: "OpenCinema", subtitle: "ул. Ораза Жандосова, 58/1", lat: 43.2302763, lng: 76.8969371, radius: 85, memory: "Тут слова излишни, часть фильма я уже наверное толком и смотреть не мог, я думал о том, как предложить тебе встречаться (и о том какие там готовят вкусные бургеры), а когда мы вышли, выбрал, может, не самый подходящий момент, но я искренне рад, что все сложилось так. И складывается дальше, ведь это только начало нашей истории, моя любовь.", ...placeMedia("opencinema", 6) },
  { id: "dostyk", name: "Достык Плаза", subtitle: "пр. Достык, Самал-2", lat: 43.233393, lng: 76.9568196, radius: 80, memory: "Наше первое свидание. Хоть и не так, как было запланировано, но с момента, как я услышал твои комментарии в кино и как ты смеялась со своих же шуток, была такой искренней и радостной, я понял, что ты невероятная и я точно хочу быть рядом с тобой. Тогда я и начал влюбляться в тебя такую, какая ты есть, и влюбляюсь по сей день. Все больше с каждым днем, любимая.", ...placeMedia("dostyk", 3, 2) },
  { id: "atakent", name: "Атакент", subtitle: "со стороны Тимирязева, у Wendy's", lat: 43.2257503, lng: 76.9097528, radius: 55, memory: "Не знаю, помнишь ты или нет, но именно здесь мы ведь впервые поцеловались, когда кончилась эта рапсодия конца света вокруг и остался только дождь, гуляя весь день по скучному атакент моллу, как мы вышли и провожая тебя в такси, я поцеловал на прощание. Хоть и быстро, хоть и настолько неожиданно даже для самого себя, что я не успел даже понять, но в тот вечер я ехал домой самым счастливым, да как впрочем и всегда после времени проведенного с тобой, Алина. Но в тот вечер особенно." },
  { id: "gymnasium105", name: "Школа", subtitle: "ул. Биокомбинатская, 289", lat: 43.239263, lng: 76.9119061, radius: 50, memory: "Место, где все началось, и наше знакомство вживую, и наш вальс. Место, где я впервые увидел тебя и был в ступоре от твоей внеземной красоты, моя звездочка.", ...placeMedia("gymnasium105", 8) },
  { id: "mistcity", name: "Мист", subtitle: "ул. Радостовца, 333а", lat: 43.2078523, lng: 76.8959682, radius: 35, memory: "Наше место, даже не помню, как мы начали туда ходить, но оно для меня стало таким тихим, спокойным и родным не за атмосферу вокруг, а благодаря тому, что там ты всегда рядом. Благодаря девушке, чья любовь наделяет каждое мое мгновение счастьем и жизнь новым смыслом, каждый момент обретает те краски, о которых я раньше и не мечтал." },
  { id: "forum", name: "Форум", subtitle: "пр. Сейфуллина, 617", lat: 43.2341076, lng: 76.9357949, radius: 90, memory: "Постоянное и неизменное место работы, точка спавна и наши бурмалсажные кресла. Вроде самый обычный торговый центр, но благодаря теплым воспоминаниям и моментам с тобой, которых здесь уже скопилось не мало, это место стало для меня действительно особенным. Я не могу пройти мимо, не подумав о тебе.", ...placeMedia("forum", 8) },
  { id: "mcdonalds", name: "Макшнаггетс", subtitle: "у Бухар Жырау", lat: 43.236244, lng: 76.927306, radius: 40, memory: "Я всегда думаю о тебе сидя тут, даже будучи в компании, где тебя нет, но ассоциации оттуда у меня всегда будут, как мы кушали после фэнтези парка, как там я познакомился с твоей компанией, как мы с тобой сидели там вечером просто разговаривая и заряжая телефоны, когда даже чувствуя себя уставшим, единственное, чего я хотел, это провести с тобой еще хотя бы немного времени вместе.", ...placeMedia("mcdonalds", 2) },
];

// Music quest stage: each track starts locked behind a lyric-snippet guessing
// game. Fill in real titles/artists/clues, and (optionally) an mp3 import for
// audioSrc + a cover image import — both stay as nice placeholders until then.
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  clue: string; // a short lyric excerpt shown as the guessing hint
  audioSrc?: string; // TODO: import an mp3 and assign it here
  cover?: string; // TODO: import album art and assign it here
}
const MUSIC_TRACKS: MusicTrack[] = [
  { id: "t1", title: "КУБИК ЛЬДА", artist: "GONE.Fludd", clue: "Под эту песню мы чуть не деактивировались", audioSrc: track1 },
  { id: "t2", title: "Stateside", artist: "PinkPantheress, Zara Larsson", clue: "Я сказал, что украду в плейлист на третий день нашего знакомства", audioSrc: track2 },
  { id: "t3", title: "Рядом С Тобой", artist: "GONE.Fludd & M00NCHILD", clue: "Эта песня у меня ассоциируется с тобой с самого нашего знакомства", audioSrc: track3 },
  { id: "t4", title: "Ma meilleure ennemie", artist: "Stromae & Pomme", clue: "Наши красивейшие 4 кадра", audioSrc: track4 },
  { id: "t5", title: "Вальс", artist: "", clue: "Скебоб", audioSrc: track5 },
  { id: "t6", title: "UFO LUV", artist: "GONE.Fludd", clue: "Песня которая ассоциируется с нами", audioSrc: track6 },
];

const DATE_RANGE: Date[] = [];
for (let i = 0; i <= 30; i++) {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() + i);
  DATE_RANGE.push(d);
}

// Builds a sessions map anchored to today's real date instead of a fixed calendar date,
// so the schedule always looks current no matter when the site is opened.
function buildSessions(dailyTimes: string[][]): Record<string,string[]> {
  const map: Record<string,string[]> = {};
  for (let i = 0; i < dailyTimes.length; i++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + i);
    map[fmtDate(d)] = dailyTimes[i];
  }
  return map;
}

const GENRES = ["Все", "Боевик", "Драма", "Комедия", "Триллер", "Фантастика", "Анимация"];

const RU_DAYS     = ["вс","пн","вт","ср","чт","пт","сб"];
const RU_MONTHS_S = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
const RU_MONTHS_L = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const RU_MONTHS_N = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isToday(d: Date)   { return fmtDate(d) === fmtDate(TODAY); }
function isPast(d: Date)    { return fmtDate(d) < fmtDate(TODAY); }
function isSpecial(d: Date) { return fmtDate(d) === SPECIAL_DATE; }
function calendarAllowed(d: Date) { return !isPast(d) || isSpecial(d); }
function fmtDuration(min: number) { return `${Math.floor(min/60)} ч ${min%60} мин`; }

// Quest progress (found places, unlocked tracks, current stage, …) is kept in
// localStorage instead of plain useState so closing the tab or the phone
// discarding a backgrounded page doesn't instantly wipe everything back to
// zero. It still expires after a while rather than being a permanent save —
// long enough to survive a closed browser, not forever.
const PERSIST_TTL_MS = 2 * 60 * 1000; // 2 minutes
function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { value: T; ts: number };
    if (typeof parsed?.ts !== "number" || Date.now() - parsed.ts > PERSIST_TTL_MS) return fallback;
    return parsed.value;
  } catch {
    return fallback;
  }
}
function savePersisted<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() }));
  } catch {
    // localStorage unavailable (private mode, storage full, …) — progress
    // just won't survive a reload, same as before this existed.
  }
}

// ── Types & Data ──────────────────────────────────────────────────────────────

interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  genre: string;
  subgenre: string;
  duration: number;
  rating: number;
  ageLimit: string;
  poster: string;
  backdrop: string;
  description: string;
  fullDescription: string;
  director: string;
  cast: string[];
  country: string;
  year: number;
  language: string;
  sessions: Record<string, string[]>;
}

const MOVIES: Movie[] = [
  {
    id: 7,
    title: "Интерстеллар",
    originalTitle: "Interstellar",
    genre: "Фантастика",
    subgenre: "Драма / Приключения",
    duration: 169,
    rating: 9.0,
    ageLimit: "12+",
    poster: posterInterstellar,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Команда исследователей путешествует через червоточину в поисках нового дома для человечества.",
    fullDescription: "В недалёком будущем Земля переживает глобальный продовольственный кризис. Бывший пилот НАСА Купер вместе с командой учёных отправляется в межзвёздное путешествие через червоточину близ Сатурна в поисках новых обитаемых планет. Им предстоит столкнуться с искажением времени, чёрными дырами и невероятными открытиями о природе вселенной.",
    director: "Кристофер Нолан",
    cast: ["Мэттью МакКонахи", "Энн Хэтэуэй", "Джессика Честейн", "Майкл Кейн", "Мэтт Дэймон"],
    country: "США, Великобритания",
    year: 2014,
    language: "Дублированный",
    sessions: { "2026-06-03": ["19:10"] },
  },
  {
    id: 1,
    title: "Человек-паук: Новый день",
    originalTitle: "Spider-Man: Brand New Day",
    genre: "Боевик",
    subgenre: "Супергероика / Приключения",
    duration: 145,
    rating: 7.9,
    ageLimit: "12+",
    poster: posterSpidermanBrandNewDay,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "После заклинания, заставившего мир забыть, кто такой Питер Паркер, он в одиночку защищает Нью-Йорк — пока с его силами не начинает происходить нечто необъяснимое.",
    fullDescription: "Прошло четыре года после событий «Человека-паука: Нет пути домой». Питер Паркер анонимно охраняет улицы Нью-Йорка, полностью посвятив себя роли супергероя, пока его бывшие друзья строят жизнь без него. Постоянное напряжение и одиночество запускают неожиданную и потенциально опасную эволюцию его способностей — и одновременно с этим на город надвигается новая, невидимая угроза.",
    director: "Дестин Дэниел Креттон",
    cast: ["Том Холланд", "Зендея", "Сэди Синк", "Джейкоб Батало", "Джон Бернтал", "Марк Руффало"],
    country: "США",
    year: 2026,
    language: "Дублированный",
    sessions: buildSessions([
      ["12:00","15:20","18:40","21:50"],
      ["11:30","14:50","18:10","21:30","23:50"],
      ["12:00","15:20","18:40","21:50"],
      ["13:00","16:20","19:40","22:50"],
      ["11:30","14:50","18:10","21:30"],
      ["12:00","15:20","18:40","21:50","23:50"],
      ["13:00","16:20","19:40","22:50"],
      ["11:30","14:50","18:10","21:30"],
      ["12:00","15:20","18:40","21:50"],
      ["13:00","16:20","19:40","22:50"],
      ["11:30","14:50","18:10","21:30"],
      ["12:00","15:20","18:40","21:50"],
      ["13:00","16:20","19:40"],
      ["11:30","14:50","18:10","21:30"],
    ]),
  },
  {
    id: 2,
    title: "Человек-паук: Через вселенные",
    originalTitle: "Spider-Man: Across the Spider-Verse",
    genre: "Анимация",
    subgenre: "Супергероика / Приключения",
    duration: 140,
    rating: 8.6,
    ageLimit: "12+",
    poster: posterSpidermanAcrossSpiderverse,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Майлз Моралес отправляется в путешествие по мультивселенной вместе с Гвен Стейси — и сталкивается с целым обществом Людей-пауков.",
    fullDescription: "Майлз Моралес возвращается в новом масштабном приключении. Вместе с Гвен Стейси он путешествует по мультивселенной, где встречает команду Людей-пауков, охраняющих её существование. Но когда герои расходятся во взглядах на то, как защищать мультивселенную, Майлзу приходится сразиться с ними и определить, что значит быть героем в собственном мире.",
    director: "Хоаким Дос Сантос, Кемп Пауэрс, Джастин К. Томпсон",
    cast: ["Шамейк Мур (голос)", "Хейли Стайнфелд (голос)", "Джейк Джонсон (голос)", "Оскар Айзек (голос)", "Исса Рэй (голос)"],
    country: "США",
    year: 2023,
    language: "Дублированный",
    sessions: buildSessions([
      ["10:30","13:40","16:50","20:00"],
      ["11:00","14:10","17:20","20:30"],
      ["10:30","13:40","16:50","20:00"],
      ["11:00","14:10","17:20"],
      ["10:30","13:40","16:50","20:00"],
      ["11:00","14:10","17:20","20:30"],
      ["10:30","13:40","16:50"],
      ["11:00","14:10","17:20","20:30"],
      ["10:30","13:40","16:50","20:00"],
      ["11:00","14:10","17:20"],
    ]),
  },
  {
    id: 3,
    title: "Мамма Мия!",
    originalTitle: "Mamma Mia!",
    genre: "Комедия",
    subgenre: "Мюзикл / Романтическая комедия",
    duration: 108,
    rating: 6.9,
    ageLimit: "12+",
    poster: posterMammaMia,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Накануне свадьбы невеста приглашает трёх маминых бывших возлюбленных, надеясь узнать, кто из них — её настоящий отец. Музыкальная комедия на песни ABBA.",
    fullDescription: "На греческом острове Донна управляет небольшим отелем и в одиночку растит дочь Софи. Перед собственной свадьбой Софи тайком приглашает трёх мужчин, которые могли быть её отцом — все они были возлюбленными Донны много лет назад. Праздничная история о любви, дружбе и материнстве под музыку легендарной группы ABBA.",
    director: "Филлида Ллойд",
    cast: ["Мерил Стрип", "Аманда Сайфрид", "Пирс Броснан", "Колин Фёрт", "Стеллан Скарсгард", "Джулия Уолтерс"],
    country: "США, Великобритания",
    year: 2008,
    language: "Дублированный",
    sessions: buildSessions([
      ["11:00","15:00","19:00"],
      ["12:00","16:00","20:00"],
      ["11:00","15:00","19:00"],
      ["12:00","16:00"],
      ["11:00","15:00","19:00"],
      ["12:00","16:00","20:00"],
      ["11:00","15:00"],
      ["12:00","16:00","20:00"],
      ["11:00","15:00","19:00"],
    ]),
  },
  {
    id: 4,
    title: "Звёздные войны: Мандалорец и Грогу",
    originalTitle: "The Mandalorian and Grogu",
    genre: "Фантастика",
    subgenre: "Космическая опера / Приключения",
    duration: 132,
    rating: 7.4,
    ageLimit: "6+",
    poster: posterMandalorianGrogu,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Дин Джарин и его юный ученик Грогу отправляются на самое опасное задание — по поручению молодой Новой Республики.",
    fullDescription: "Империя пала, но по галактике всё ещё скитаются осколки её войск. Молодая Новая Республика, стремясь защитить всё, за что боролось Восстание, обращается за помощью к легендарному охотнику за головами Дину Джарину и его ученику Грогу. Приключение выводит дуэт на новые, ранее не показанные в саге миры.",
    director: "Джон Фавро",
    cast: ["Педро Паскаль", "Сигурни Уивер", "Джереми Аллен Уайт"],
    country: "США",
    year: 2026,
    language: "Дублированный",
    sessions: buildSessions([
      ["10:00","13:10","16:20","19:30","22:30"],
      ["10:30","13:40","16:50","20:00"],
      ["10:00","13:10","16:20","19:30"],
      ["10:30","13:40","16:50","20:00","22:50"],
      ["10:00","13:10","16:20","19:30"],
      ["10:30","13:40","16:50","20:00"],
      ["10:00","13:10","16:20"],
      ["10:30","13:40","16:50","20:00"],
      ["10:00","13:10","16:20","19:30"],
      ["10:30","13:40","16:50"],
      ["10:00","13:10","16:20","19:30"],
    ]),
  },
  {
    id: 5,
    title: "Зверополис 2",
    originalTitle: "Zootopia 2",
    genre: "Анимация",
    subgenre: "Детектив / Семейный",
    duration: 108,
    rating: 7.4,
    ageLimit: "6+",
    poster: posterZootopia2,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Джуди Хопс и Ник Уайлд снова в деле: в город приезжает загадочный змей Гэри, и Зверополис переворачивается с ног на голову.",
    fullDescription: "Напарники-полицейские Джуди Хопс и Ник Уайлд берутся за самое запутанное дело в своей карьере. Появление в городе питона Гэри Де'Снейка заставляет их отправиться под прикрытием в неожиданные уголки Зверополиса, а их партнёрство проходит проверку на прочность как никогда раньше.",
    director: "Джаред Буш, Байрон Ховард",
    cast: ["Джинниф Гудвин (голос)", "Джейсон Бейтман (голос)", "Ке Хай Куан (голос)", "Шакира (голос)"],
    country: "США",
    year: 2025,
    language: "Дублированный",
    sessions: buildSessions([
      ["09:30","11:40","13:50","16:00","18:10"],
      ["10:00","12:10","14:20","16:30"],
      ["09:30","11:40","13:50","16:00"],
      ["10:00","12:10","14:20","16:30","18:40"],
      ["09:30","11:40","13:50","16:00"],
      ["10:00","12:10","14:20","16:30"],
      ["09:30","11:40","13:50"],
      ["10:00","12:10","14:20","16:30"],
      ["09:30","11:40","13:50","16:00"],
      ["10:00","12:10","14:20"],
      ["09:30","11:40","13:50","16:00"],
      ["10:00","12:10","14:20","16:30"],
    ]),
  },
  {
    id: 6,
    title: "Крик 7",
    originalTitle: "Scream 7",
    genre: "Триллер",
    subgenre: "Слэшер / Хоррор",
    duration: 114,
    rating: 5.8,
    ageLimit: "18+",
    poster: posterScream7,
    backdrop: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=500&fit=crop&auto=format",
    description: "Сидни Прескотт возвращается: в её тихом городке появляется новый Призрачное Лицо, и на этот раз мишенью становится её собственная дочь.",
    fullDescription: "Спустя годы после последних событий франшизы Сидни Прескотт наконец построила спокойную жизнь. Но когда в городе появляется новый убийца в маске Призрачного Лица, её худшие страхи сбываются — целью становится её дочь. Чтобы остановить кровопролитие, Сидни придётся вновь встретиться лицом к лицу с призраками своего прошлого.",
    director: "Кевин Уильямсон",
    cast: ["Нив Кэмпбелл", "Кортни Кокс", "Изабель Мэй", "Дэвид Аркетт", "Джоэл Маккейл"],
    country: "США",
    year: 2026,
    language: "Дублированный",
    sessions: buildSessions([
      ["18:30","21:00","23:30"],
      ["19:00","21:30"],
      ["18:30","21:00","23:30"],
      ["19:00","21:30","23:50"],
      ["18:30","21:00"],
      ["19:00","21:30","23:30"],
      ["18:30","21:00","23:30"],
      ["19:00","21:30"],
      ["18:30","21:00","23:30"],
      ["19:00","21:30"],
    ]),
  },
];

// ── Seat map ──────────────────────────────────────────────────────────────────

const ROWS = ["А","Б","В","Г","Д","Е","Ж","З","И","К"];
const COLS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
const SEAT_PRICE: Record<string,number> = { А:1500,Б:1500,В:1800,Г:1800,Д:2200,Е:2200,Ж:2800,З:2800,И:3500,К:3500 };

// Small lounge hall used only for the archival Interstellar 19:10 screening:
// paired seating, only one pair (two seats together) free — back row, just left of center.
const SMALL_ROWS = ["А","Б","В"];
const SMALL_COLS = [1,2,3,4,5,6,7,8];
const SMALL_PRICE = 5000;
const SMALL_FREE = new Set(["В3","В4"]);

function generateOccupied() {
  const s = new Set<string>();
  for (let i = 0; i < 35+Math.floor(Math.random()*30); i++)
    s.add(`${ROWS[Math.floor(Math.random()*ROWS.length)]}${COLS[Math.floor(Math.random()*COLS.length)]}`);
  return s;
}

function generateSmallHallOccupied() {
  const s = new Set<string>();
  for (const row of SMALL_ROWS) for (const col of SMALL_COLS) {
    const key = `${row}${col}`;
    if (!SMALL_FREE.has(key)) s.add(key);
  }
  return s;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function StarIcon({ size=12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor"><path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.09L6 8.1 3.22 9.55l.53-3.09L1.5 4.27l3.11-.45z"/></svg>;
}
function CloseIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M15 5L5 15M5 5l10 10"/></svg>;
}
function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 6.5h13M5 1.5v2M11 1.5v2"/></svg>;
}
function ChevronIcon({ dir }: { dir: "left"|"right" }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d={dir==="left"?"M10 12L6 8l4-4":"M6 12l4-4-4-4"}/></svg>;
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4.5V7l1.5 1.5"/></svg>;
}
function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M4 2.5l7 4.5-7 4.5z"/></svg>;
}
function CheckCircleIcon({ size=28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="14" r="10.5"/><path d="M9.5 14.3l3 3 6-6.6"/></svg>;
}
function FilmReelIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><circle cx="10" cy="10" r="2.1"/><circle cx="10" cy="4.3" r="1.1"/><circle cx="10" cy="15.7" r="1.1"/><circle cx="4.3" cy="10" r="1.1"/><circle cx="15.7" cy="10" r="1.1"/></svg>;
}
function SearchOffIcon({ size=32 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="14" r="8.5"/><path d="M20.2 20.2L27 27"/></svg>;
}
// Deterministic gradient pair per movie id, used for the poster fallback so it stays
// consistent across renders without needing extra state.
const POSTER_GRADIENTS: [string,string][] = [
  ["#7c2d3a","#2a1420"], ["#1f3a5f","#0f1b2e"], ["#3a2d5f","#1a1430"],
  ["#2d5f4a","#12261e"], ["#5f3a1f","#2e190f"], ["#4a1f5f","#20102e"],
];
function PosterImage({ movie, className, style }: { movie: Movie; className?: string; style?: Record<string,any> }) {
  const [failed, setFailed] = useState(false);
  const [g1,g2] = POSTER_GRADIENTS[movie.id % POSTER_GRADIENTS.length];
  if (failed) {
    return (
      <div className={className} style={{...style,background:`linear-gradient(160deg, ${g1}, ${g2})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:12,textAlign:"center"}}>
        <div style={{color:"rgba(255,255,255,0.45)"}}><FilmReelIcon size={28}/></div>
        <span style={{color:"rgba(255,255,255,0.75)",fontFamily:"'Fraunces',serif",fontSize:13,lineHeight:1.25}}>{movie.title}</span>
      </div>
    );
  }
  return <img src={movie.poster} alt={movie.title} className={className} style={style} onError={()=>setFailed(true)}/>;
}

// ── Calendar picker ───────────────────────────────────────────────────────────

function CalendarPicker({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function prevMonth() { viewMonth===0 ? (setViewMonth(11),setViewYear(y=>y-1)) : setViewMonth(m=>m-1); }
  function nextMonth() { viewMonth===11 ? (setViewMonth(0),setViewYear(y=>y+1)) : setViewMonth(m=>m+1); }

  const startDow = (new Date(viewYear,viewMonth,1).getDay()+6)%7;
  const daysInMonth = new Date(viewYear,viewMonth+1,0).getDate();
  const cells: (Date|null)[] = [];
  for (let i=0;i<startDow;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(new Date(viewYear,viewMonth,d));
  const selKey = fmtDate(selected);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v=>!v); setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all"
        style={{ background: open?"rgba(224,52,52,0.15)":"rgba(255,255,255,0.06)", border:`1px solid ${open?"rgba(224,52,52,0.4)":"rgba(255,255,255,0.1)"}`, color: open?"#e87878":"#9d9a93" }}
      >
        <CalendarIcon/>
        <span>{selected.getDate()} {RU_MONTHS_S[selected.getMonth()]} {selected.getFullYear()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 rounded-xl p-4" style={{ background:"#1a1a23", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 20px 60px rgba(0,0,0,0.7)", width:280 }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 rounded hover:text-white transition-colors" style={{color:"#7d7a73"}}><ChevronIcon dir="left"/></button>
            <span className="text-sm font-semibold" style={{color:"#f0eee9"}}>{RU_MONTHS_N[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="p-1 rounded hover:text-white transition-colors" style={{color:"#7d7a73"}}><ChevronIcon dir="right"/></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d=>(
              <div key={d} className="text-center text-[10px] uppercase tracking-wider pb-1" style={{color:"#4a4845"}}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d,i)=>{
              if (!d) return <div key={i}/>;
              const key=fmtDate(d), allowed=calendarAllowed(d), isSel=key===selKey, todayMark=isToday(d), special=isSpecial(d);
              return (
                <button key={i} disabled={!allowed} onClick={()=>{onSelect(d);setOpen(false);}} className="rounded-lg text-sm py-1.5 transition-all relative"
                  style={isSel?{background:"#e03434",color:"#fff",fontWeight:600}:special?{background:"rgba(244,162,97,0.15)",color:"#f4a261",border:"1px solid rgba(244,162,97,0.35)"}:!allowed?{color:"#2e2e35",cursor:"not-allowed"}:todayMark?{color:"#f4a261",fontWeight:600}:{color:"#b8b4ac"}}
                  onMouseEnter={e=>{if(allowed&&!isSel)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.08)";}}
                  onMouseLeave={e=>{if(allowed&&!isSel)(e.currentTarget as HTMLElement).style.background=special?"rgba(244,162,97,0.15)":"transparent";}}
                >
                  {d.getDate()}
                  {todayMark&&!isSel&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#f4a261] block"/>}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-3 flex gap-3 flex-wrap text-[10px]" style={{borderTop:"1px solid rgba(255,255,255,0.07)",color:"#7d7a73"}}>
            {[["rgba(244,162,97,0.15)","Архив"],["#e03434","Выбрано"],["rgba(255,255,255,0.05)","Недоступно"]].map(([bg,label])=>(
              <span key={label} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{background:bg,border:label==="Архив"?"1px solid rgba(244,162,97,0.35)":undefined}}/>{label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Date strip ────────────────────────────────────────────────────────────────

function DateStrip({ dates, selected, onSelect }: { dates: Date[]; selected: Date; onSelect: (d:Date)=>void }) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1" style={{scrollSnapType:"x mandatory"}}>
      {dates.map(d=>{
        const today=isToday(d), sel=fmtDate(d)===fmtDate(selected);
        return (
          <button key={fmtDate(d)} onClick={()=>onSelect(d)}
            className="flex flex-col items-center justify-center rounded-md py-2 px-1 transition-all text-sm leading-tight"
            style={{ scrollSnapAlign:"start", minWidth:58, flexShrink:0,
              background: sel?"#e03434":today?"#1e1e28":"#13131a",
              border: `1px solid ${sel?"transparent":today?"rgba(244,162,97,0.3)":"rgba(255,255,255,0.06)"}`,
              color: sel?"#fff":today?"#f4a261":"#b8b4ac" }}
          >
            <span className="text-[10px] uppercase tracking-wider font-medium opacity-70">{today?"сег":RU_DAYS[d.getDay()]}</span>
            <span className="text-base font-semibold">{d.getDate()}</span>
            <span className="text-[10px] opacity-60">{RU_MONTHS_S[d.getMonth()]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Seat modal ────────────────────────────────────────────────────────────────

function SeatModal({ movie, time, date, onClose, onBack, onQuestUnlock }: {
  movie: Movie; time: string; date: Date; onClose: () => void; onBack: () => void; onQuestUnlock?: () => void;
}) {
  const isSmallHall = movie.id===7 && fmtDate(date)===SPECIAL_DATE && time==="19:10";
  const rows = isSmallHall ? SMALL_ROWS : ROWS;
  const cols = isSmallHall ? SMALL_COLS : COLS;
  const priceOf = (row: string) => isSmallHall ? SMALL_PRICE : (SEAT_PRICE[row] ?? 400);
  // On this special screening, tickets are only sold in pairs — no watching
  // it solo, and no group outings either, just the two of you.
  const requiresPair = isSmallHall;

  const [occupied] = useState(()=> isSmallHall ? generateSmallHallOccupied() : generateOccupied());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [purchased, setPurchased] = useState(false);
  const [pairWarning, setPairWarning] = useState(false);

  const total = Array.from(selected).reduce((s,k)=>s+priceOf(k.charAt(0)),0);

  if (purchased) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{background:"rgba(0,0,0,0.9)"}}>
        <div className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4" style={{background:"#13131a",border:"1px solid rgba(255,255,255,0.1)"}}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{background:"rgba(224,52,52,0.15)",border:"2px solid rgba(224,52,52,0.4)",color:"#e03434"}}>
            <CheckCircleIcon size={30}/>
          </div>
          <h2 className="text-2xl font-semibold" style={{fontFamily:"'Fraunces',serif"}}>Билеты куплены!</h2>
          <div className="text-sm space-y-1" style={{color:"#9d9a93"}}>
            <p className="font-medium text-base" style={{color:"#f0eee9"}}>{movie.title}</p>
            <p>{time} · {date.getDate()} {RU_MONTHS_L[date.getMonth()]} {date.getFullYear()}</p>
            <p>Места: {Array.from(selected).sort().join(", ")}</p>
          </div>
          <p className="font-bold text-xl" style={{color:"#f4a261"}}>{total.toLocaleString("ru")} ₸</p>
          <p className="text-xs" style={{color:"#4a4845"}}>Билеты отправлены на вашу почту</p>
          {isSmallHall ? (
            <button onClick={onQuestUnlock ?? onClose} className="mt-2 px-8 py-2.5 rounded-lg text-sm font-semibold hover:opacity-85 transition-opacity flex items-center gap-2" style={{background:"#e879c9",color:"#fff"}}>
              <HeartIcon size={14}/>
              Продолжить →
              <HeartIcon size={14}/>
            </button>
          ) : (
            <button onClick={onClose} className="mt-2 px-8 py-2.5 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity" style={{background:"#e03434",color:"#fff"}}>
              Отлично!
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" style={{background:"rgba(0,0,0,0.85)",paddingBottom:"env(safe-area-inset-bottom)"}} onClick={e=>e.target===e.currentTarget&&onBack()}>
      <div className="w-full max-w-3xl rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col" style={{background:"#13131a",border:"1px solid rgba(255,255,255,0.1)",maxHeight:"95vh"}}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <button onClick={onBack} className="p-1.5 rounded-full transition-colors shrink-0" style={{color:"#7d7a73"}} onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color="#f0eee9")} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color="#7d7a73")}>
            <ChevronIcon dir="left"/>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate" style={{fontFamily:"'Fraunces',serif"}}>{movie.title}</h2>
            <p className="text-xs" style={{color:"#7d7a73"}}>{time} · {date.getDate()} {RU_MONTHS_L[date.getMonth()]} {date.getFullYear()} · {isSmallHall ? "Малый лаунж-зал" : "Зал 3"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full shrink-0 transition-colors" style={{color:"#7d7a73"}} onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color="#f0eee9")} onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color="#7d7a73")}>
            <CloseIcon size={18}/>
          </button>
        </div>

        {/* Seat map */}
        <div className="px-5 pt-5 pb-3 overflow-y-auto flex-1">
          <div className="w-full rounded py-1.5 text-center text-[10px] tracking-[0.25em] uppercase mb-6" style={{background:"linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",color:"#7d7a73",boxShadow:"0 6px 20px rgba(255,255,255,0.03)"}}>
            Экран
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="mx-auto" style={{width:"fit-content"}}>
              {rows.map(row=>(
                <div key={row} className="flex items-center gap-1 mb-1" style={isSmallHall?{marginBottom:10}:undefined}>
                  <span className="text-[10px] w-5 text-right shrink-0" style={{color:"#4a4845"}}>{row}</span>
                  <div className="flex" style={{gap:isSmallHall?0:4}}>
                    {cols.map((col,ci)=>{
                      const key=`${row}${col}`, isOcc=occupied.has(key), isSel=selected.has(key), isPrem=!isSmallHall&&SEAT_PRICE[row]>=650;
                      const pairGap = isSmallHall && ci>0 && ci%2===0;
                      return (
                        <button key={key} onClick={()=>{
                          if(isOcc) return;
                          setPairWarning(false);
                          setSelected(prev=>{
                            const n=new Set(prev);
                            if (n.has(key)) { n.delete(key); return n; }
                            if (requiresPair && n.size>=2) return n; // pairs only — ignore a 3rd pick
                            n.add(key);
                            return n;
                          });
                        }} title={`${key} — ${priceOf(row)} ₸`} className="rounded-sm transition-all"
                          style={{width:isSmallHall?30:26,height:isSmallHall?26:22,fontSize:9,marginLeft:pairGap?14:isSmallHall?2:0,cursor:isOcc?"not-allowed":"pointer",
                            background:isOcc?"rgba(255,255,255,0.05)":isSel?"#e03434":isPrem?"rgba(244,162,97,0.18)":"rgba(255,255,255,0.1)",
                            border:isOcc?"none":isSel?"none":isPrem?"1px solid rgba(244,162,97,0.3)":"1px solid rgba(255,255,255,0.12)",
                            color:isOcc?"#282828":isSel?"#fff":isPrem?"#f4a261":"#9d9a93"}}
                        >{col}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center mt-5 text-xs" style={{color:"#7d7a73"}}>
            {[["rgba(255,255,255,0.1)","Свободно"],...(isSmallHall?[]:[["rgba(244,162,97,0.18)","Премиум"]] as [string,string][]),["#e03434","Выбрано"],["rgba(255,255,255,0.05)","Занято"]].map(([bg,label])=>(
              <span key={label} className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 rounded-sm" style={{background:bg}}/>{label}</span>
            ))}
          </div>
          <div className="mt-4 text-center text-xs" style={{color:"#4a4845"}}>
            {isSmallHall ? "Диванчики по парам · всего 24 места · архивный спецпоказ · билеты только по два" : "Ряды И–К — Премиум · Ряды Ж–З — Комфорт · Ряды А–Е — Стандарт"}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between gap-4" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <div>
            {pairWarning ? (
              <p className="text-sm font-medium" style={{color:"#f4a261"}}>На такое в одиночку не ходят – возьми ещё одно место :)</p>
            ) : selected.size>0 ? (
              <>
                <p className="text-xs mb-0.5" style={{color:"#7d7a73"}}>{selected.size} {selected.size===1?"место":"места"}: {Array.from(selected).sort().join(", ")}</p>
                <p className="font-bold text-lg" style={{color:"#f4a261"}}>{total.toLocaleString("ru")} ₸</p>
              </>
            ) : (
              <p className="text-sm" style={{color:"#4a4845"}}>{requiresPair ? "Выберите два места на схеме" : "Выберите место на схеме"}</p>
            )}
          </div>
          <button
            disabled={selected.size===0}
            onClick={()=>{
              if (requiresPair && selected.size===1) { setPairWarning(true); return; }
              setPurchased(true);
            }}
            className="px-7 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
            style={selected.size===0?{background:"rgba(255,255,255,0.06)",color:"#4a4845",cursor:"not-allowed"}:{background:"#e03434",color:"#fff"}}
          >
            Оплатить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Movie detail modal ────────────────────────────────────────────────────────

function MovieDetailModal({ movie, initialDate, onClose, onBookSeat }: {
  movie: Movie;
  initialDate: Date;
  onClose: () => void;
  onBookSeat: (movie: Movie, time: string, date: Date) => void;
}) {
  const [activeDate, setActiveDate] = useState<Date>(()=>{
    // Pick the first date with sessions >= initialDate, or fallback to initialDate
    const key = fmtDate(initialDate);
    if (movie.sessions[key]) return initialDate;
    const dates = Object.keys(movie.sessions).sort();
    const future = dates.find(d => d >= key);
    if (future) return new Date(future);
    return initialDate;
  });

  // Dates that have sessions for this movie (strip: today+30d only)
  const movieDates = DATE_RANGE.filter(d => movie.sessions[fmtDate(d)]);
  // Also check if the special date has sessions
  const specialD = new Date(2026,5,3);
  if (movie.sessions[SPECIAL_DATE] && !movieDates.find(d=>fmtDate(d)===SPECIAL_DATE)) {
    movieDates.unshift(specialD);
  }

  const dateKey = fmtDate(activeDate);
  const sessions = movie.sessions[dateKey] ?? [];
  const pastDate = isPast(activeDate);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Score bar width
  const scoreW = `${(movie.rating/10)*100}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{background:"rgba(0,0,0,0.88)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div
        className="w-full rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        style={{background:"#0f0f16", border:"1px solid rgba(255,255,255,0.09)", maxHeight:"96vh", maxWidth:860}}
      >
        {/* Backdrop hero */}
        <div className="relative shrink-0" style={{height:220, background:"#0b0b0f"}}>
          <img src={movie.backdrop} alt="" className="w-full h-full object-cover" style={{opacity:0.35}} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}}/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to bottom, rgba(15,15,22,0.2) 0%, rgba(15,15,22,0.95) 100%)"}}/>
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 transition-all z-10"
            style={{background:"rgba(0,0,0,0.5)",color:"#9d9a93",border:"1px solid rgba(255,255,255,0.1)"}}
            onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color="#fff")}
            onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color="#9d9a93")}
          >
            <CloseIcon size={18}/>
          </button>
          {/* Poster + title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end gap-5">
            <div className="shrink-0 rounded-xl overflow-hidden shadow-2xl" style={{width:80,height:120,background:"#1a1a23",border:"1px solid rgba(255,255,255,0.1)"}}>
              <PosterImage movie={movie} className="w-full h-full object-cover"/>
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{background:"rgba(224,52,52,0.85)",color:"#fff"}}>{movie.ageLimit}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{background:"rgba(255,255,255,0.1)",color:"#b8b4ac"}}>{movie.genre}</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight mb-0.5 text-white" style={{fontFamily:"'Fraunces',serif"}}>{movie.title}</h2>
              <p className="text-sm" style={{color:"#7d7a73"}}>{movie.originalTitle} · {movie.year} · {movie.country}</p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 px-6 py-4" style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            <span className="flex items-center gap-2 text-sm" style={{color:"#9d9a93"}}>
              <span style={{color:"#f4a261"}}><ClockIcon/></span>
              {fmtDuration(movie.duration)}
            </span>
            <span className="flex items-center gap-1.5 text-sm" style={{color:"#9d9a93"}}>
              <StarIcon size={13}/>
              <span style={{color:"#f0eee9",fontWeight:600}}>{movie.rating}</span>
              <span style={{color:"#4a4845"}}>/ 10</span>
              <span className="ml-1 h-1 rounded-full overflow-hidden inline-block align-middle" style={{width:50,background:"rgba(255,255,255,0.08)"}}>
                <span className="block h-full rounded-full" style={{width:scoreW,background:"#f4a261"}}/>
              </span>
            </span>
            <span className="text-sm" style={{color:"#9d9a93"}}><span style={{color:"#7d7a73"}}>Язык: </span>{movie.language}</span>
            <span className="text-sm" style={{color:"#9d9a93"}}><span style={{color:"#7d7a73"}}>Жанр: </span>{movie.subgenre}</span>
          </div>

          {/* Info columns */}
          <div className="grid md:grid-cols-2 gap-0" style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            {/* Description */}
            <div className="px-6 py-5" style={{borderRight:"1px solid rgba(255,255,255,0.06)"}}>
              <h3 className="text-xs uppercase tracking-wider mb-3 font-medium" style={{color:"#4a4845"}}>О фильме</h3>
              <p className="text-sm leading-relaxed" style={{color:"#b8b4ac"}}>{movie.fullDescription}</p>
            </div>
            {/* Cast & Crew */}
            <div className="px-6 py-5">
              <h3 className="text-xs uppercase tracking-wider mb-3 font-medium" style={{color:"#4a4845"}}>Создатели</h3>
              <div className="mb-3">
                <p className="text-xs mb-1" style={{color:"#4a4845"}}>Режиссёр</p>
                <p className="text-sm font-medium" style={{color:"#f0eee9"}}>{movie.director}</p>
              </div>
              <div>
                <p className="text-xs mb-2" style={{color:"#4a4845"}}>В ролях</p>
                <div className="flex flex-col gap-1">
                  {movie.cast.map(name=>(
                    <span key={name} className="text-sm" style={{color:"#b8b4ac"}}>{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Session picker */}
          <div className="px-6 py-5">
            <h3 className="text-xs uppercase tracking-wider mb-4 font-medium" style={{color:"#4a4845"}}>Расписание сеансов</h3>

            {/* Date tabs for this movie */}
            {movieDates.length === 0 ? (
              <p className="text-sm" style={{color:"#4a4845"}}>Нет ближайших сеансов</p>
            ) : (
              <>
                <div className="flex gap-1.5 flex-wrap mb-5">
                  {movieDates.map(d=>{
                    const sel = fmtDate(d)===dateKey;
                    const tod = isToday(d);
                    const spec = isSpecial(d);
                    return (
                      <button key={fmtDate(d)} onClick={()=>setActiveDate(d)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                        style={sel
                          ? {background:"#e03434",color:"#fff"}
                          : spec
                          ? {background:"rgba(244,162,97,0.12)",color:"#f4a261",border:"1px solid rgba(244,162,97,0.3)"}
                          : {background:"rgba(255,255,255,0.06)",color:tod?"#f4a261":"#9d9a93",border:`1px solid ${tod?"rgba(244,162,97,0.3)":"rgba(255,255,255,0.08)"}`}
                        }
                      >
                        {tod && !sel && <span className="w-1.5 h-1.5 rounded-full bg-[#f4a261]"/>}
                        <span>{d.getDate()} {RU_MONTHS_S[d.getMonth()]}</span>
                        {tod && <span className="text-[10px] opacity-70 ml-0.5">сег</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sessions for active date */}
                {sessions.length === 0 ? (
                  <p className="text-sm" style={{color:"#4a4845"}}>Нет сеансов на эту дату</p>
                ) : (
                  <div>
                    <p className="text-xs mb-3" style={{color:"#4a4845"}}>
                      {activeDate.getDate()} {RU_MONTHS_L[activeDate.getMonth()]} {activeDate.getFullYear()}
                      {pastDate && " — архивный показ"}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {sessions.map(t=>{
                        const isSpecialShow = movie.id===7 && isSpecial(activeDate) && t==="19:10";
                        const disabled = pastDate && !isSpecialShow;
                        return (
                          <button key={t} disabled={disabled} onClick={()=>onBookSeat(movie,t,activeDate)}
                            className="rounded-xl transition-all"
                            style={disabled
                              ? {background:"rgba(255,255,255,0.04)",color:"#3a3a3a",cursor:"not-allowed",padding:"10px 18px"}
                              : {background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#f0eee9",padding:"10px 18px",cursor:"pointer"}
                            }
                            onMouseEnter={e=>{if(!disabled){(e.currentTarget as HTMLElement).style.background="rgba(224,52,52,0.15)";(e.currentTarget as HTMLElement).style.borderColor="rgba(224,52,52,0.4)";(e.currentTarget as HTMLElement).style.color="#e87878";}}}
                            onMouseLeave={e=>{if(!disabled){(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.06)";(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)";(e.currentTarget as HTMLElement).style.color="#f0eee9";}}}
                          >
                            <div className="text-base font-semibold">{t}</div>
                            <div className="text-[10px] mt-0.5" style={{color:disabled?"#3a3a3a":"#7d7a73"}}>
                              {disabled ? "Завершён" : isSpecialShow ? "Малый зал · спецпоказ" : "Зал 3 · 2D"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Movie card ────────────────────────────────────────────────────────────────

function MovieCard({ movie, selectedDate, onOpen }: {
  movie: Movie; selectedDate: Date; onOpen: (movie: Movie) => void;
}) {
  const dateKey = fmtDate(selectedDate);
  const sessions = movie.sessions[dateKey] ?? [];
  const past = isPast(selectedDate) && !(movie.id===7 && isSpecial(selectedDate));

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{background:"#13131a",border:"1px solid rgba(255,255,255,0.07)",transition:"transform 0.2s, box-shadow 0.2s"}}
      onClick={()=>onOpen(movie)}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 14px 48px rgba(0,0,0,0.55)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}
    >
      {/* Poster */}
      <div className="relative" style={{aspectRatio:"2/3",background:"#0b0b0f"}}>
        <PosterImage movie={movie} className="w-full h-full object-cover" style={{opacity:0.88}}/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to top, #13131a 0%, transparent 55%)"}}/>
        <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded" style={{background:"rgba(0,0,0,0.7)",color:"#f0eee9",border:"1px solid rgba(255,255,255,0.12)"}}>
          {movie.ageLimit}
        </span>
        <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1" style={{background:"rgba(224,52,52,0.85)",color:"#fff"}}>
          <StarIcon/>{movie.rating}
        </span>
        {/* Play hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{opacity:0}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.opacity="1";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.opacity="0";}}
        >
          <div className="rounded-full p-3" style={{background:"rgba(224,52,52,0.8)"}}>
            <PlayIcon/>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 md:gap-2 p-2.5 md:p-3.5 flex-1">
        <div>
          <h3 className="text-sm font-semibold leading-snug mb-0.5" style={{fontFamily:"'Fraunces',serif",color:"#f0eee9"}}>{movie.title}</h3>
          <div className="flex items-center gap-2 text-xs" style={{color:"#7d7a73"}}>
            <span>{movie.genre}</span><span>·</span><span>{fmtDuration(movie.duration)}</span>
          </div>
        </div>

        <div className="mt-auto pt-2" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {sessions.length === 0 ? (
            <p className="text-xs text-center py-1" style={{color:"#4a4845"}}>{past?"Показы завершены":"Нет сеансов"}</p>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{color:"#7d7a73"}}>Сеансы</p>
              <div className="flex flex-wrap gap-1.5">
                {sessions.slice(0,4).map(t=>(
                  <span key={t} className="text-xs px-2 py-0.5 rounded" style={past
                    ? {background:"rgba(255,255,255,0.04)",color:"#4a4845"}
                    : {background:"rgba(224,52,52,0.1)",color:"#e87878",border:"1px solid rgba(224,52,52,0.2)"}}>
                    {t}
                  </span>
                ))}
                {sessions.length>4 && <span className="text-xs px-2 py-0.5 rounded" style={{color:"#4a4845"}}>+{sessions.length-4}</span>}
              </div>
              {!past && (
                <button
                  className="mt-2.5 w-full py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{background:"rgba(224,52,52,0.12)",color:"#e87878",border:"1px solid rgba(224,52,52,0.2)"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(224,52,52,0.22)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(224,52,52,0.12)";}}
                  onClick={e=>{e.stopPropagation(); onOpen(movie);}}
                >
                  Выбрать место
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

// ── Quest map (post-purchase surprise for the special screening) ───────────────

function HeartIcon({ size=16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.1C.5 8.6 2 5 5.6 5c2 0 3.5 1.1 4.4 2.6C10.9 6.1 12.4 5 14.4 5 18 5 19.5 8.6 22 11.9 19.5 16.4 12 21 12 21z"/></svg>;
}
function ArrowIcon({ dir, size=22 }: { dir: "left"|"right"; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{dir==="left" ? <path d="M15 5l-7 7 7 7"/> : <path d="M9 5l7 7-7 7"/>}</svg>;
}
function ExpandIcon({ size=16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3"/></svg>;
}

function QuestMapScreen({ onContinue }: { onContinue: () => void }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [found, setFound] = useState<Set<string>>(() => new Set(loadPersisted<string[]>("lyra-quest-found", [])));
  const [openPlace, setOpenPlace] = useState<QuestPlace | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [tilesReady, setTilesReady] = useState(false);
  const allFound = found.size === QUEST_PLACES.length;

  useEffect(() => { savePersisted("lyra-quest-found", Array.from(found)); }, [found]);

  // A place's photos and videos are shown together as one gallery — swiping
  // or using the arrows moves through both, in that order.
  const openMedia: { type: "photo" | "video"; src: string }[] = openPlace
    ? [
        ...(openPlace.photos ?? []).map(src => ({ type: "photo" as const, src })),
        ...(openPlace.videos ?? []).map(src => ({ type: "video" as const, src })),
      ]
    : [];

  // Warm the browser's cache for the whole gallery as soon as the place
  // card opens — before the lightbox is even tapped. Without this, each
  // <img>/<video> only starts fetching the moment you swipe onto it, which
  // reads as "slow to load" every time. Prefetching here means by the time
  // she's swiping, everything's already sitting in cache.
  useEffect(() => {
    if (!openPlace) return;
    const urls = [...(openPlace.photos ?? []), ...(openPlace.videos ?? [])];
    urls.forEach(url => {
      if (/\.(mp4|mov|webm)$/i.test(url)) {
        fetch(url).catch(() => {});
      } else {
        const img = new Image();
        img.src = url;
      }
    });
  }, [openPlace]);

  // Lock background scroll — without this, dragging on this full-screen
  // takeover was scrolling the page underneath it.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    // Guard against React 18 StrictMode's dev-only double-invoke of effects:
    // we only ever create the map once and deliberately never remove() it on
    // the phantom cleanup pass — Leaflet + rapid remove/recreate is a known
    // source of a silently-broken "zombie" map with no working click handlers.
    // This screen is a one-time full-page takeover, so skipping teardown here
    // is a safe trade-off.
    if (mapRef.current || !mapDivRef.current) return;

    // Keep the explorable area tight around just our 4 places, padded a bit —
    // she shouldn't be able to wander off into the whole city.
    const lats = QUEST_PLACES.map(p=>p.lat), lngs = QUEST_PLACES.map(p=>p.lng);
    const bounds = L.latLngBounds([Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]);
    const padded = bounds.pad(0.35);

    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: true, minZoom: 13, maxZoom: 18, maxBounds: padded, maxBoundsViscosity: 0.9 });
    mapRef.current = map;
    map.fitBounds(bounds, { padding: [50, 50] });
    // Zoom in a bit past the exact fit — with 7 places some sit close enough
    // together that at the tightest-fit zoom their tap targets overlap, and
    // Leaflet always resolves an overlap to the same marker, which reads as
    // "some places won't open." More breathing room between pins fixes that.
    map.setZoom(map.getZoom() + 1);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    // Markers are created immediately below, but painting them before the
    // base tiles have loaded means they briefly float over a blank grey
    // grid — and since their "found" styling comes from localStorage, an
    // already-found pin shows its highlighted state right away too, which
    // reads as spoiling progress before she's even seen the map. Wait for
    // the tile layer's own load event (fires once the visible tiles are
    // in) before revealing any pins at all; see the CSS fade below.
    // Safety net: if tiles are ever slow/blocked again, don't leave pins
    // hidden forever — reveal them after 4s regardless.
    let revealed = false;
    const reveal = () => { if (!revealed) { revealed = true; setTilesReady(true); } };
    tileLayer.on("load", reveal);
    setTimeout(reveal, 4000);

    QUEST_PLACES.forEach(place => {
      const handleClick = () => {
        setFound(prev => {
          if (prev.has(place.id)) return prev;
          const next = new Set(prev);
          next.add(place.id);
          return next;
        });
        setLightboxIndex(null);
        setOpenPlace(place);
      };

      // Invisible tap zone sized to the real place (a mall like Forum or
      // OpenCinema's building spans way more than a pixel on screen) — on
      // mobile, hunting for the exact coordinate to tap was the whole
      // problem, so this makes the entire building tappable, not just its
      // marked center.
      L.circle([place.lat, place.lng], {
        radius: place.radius ?? 45,
        stroke: false,
        fillOpacity: 0,
        interactive: true,
        bubblingMouseEvents: false,
      }).addTo(map).on("click", handleClick);

      const icon = L.divIcon({
        className: "",
        html: `<div class="quest-pin quest-pin--hidden" data-id="${place.id}"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
      // Leaflet's own click API is the reliable path here — interactive
      // layers stop native event propagation, so delegating the click from
      // a parent React onClick never actually receives it.
      marker.on("click", handleClick);
    });
  }, []);

  // Sync marker visuals whenever `found` changes
  useEffect(() => {
    const container = mapDivRef.current;
    if (!container) return;
    QUEST_PLACES.forEach(place => {
      const el = container.querySelector<HTMLDivElement>(`.quest-pin[data-id="${place.id}"]`);
      if (!el) return;
      if (found.has(place.id)) {
        el.classList.remove("quest-pin--hidden");
        el.classList.add("quest-pin--found");
      } else {
        el.classList.add("quest-pin--hidden");
        el.classList.remove("quest-pin--found");
      }
    });
  }, [found]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{background:"linear-gradient(160deg, #2a1f3d 0%, #3d2647 30%, #4a2f52 55%, #35304f 100%)",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <style>{`
        .quest-pin { width:16px; height:16px; border-radius:50%; transition: all .35s cubic-bezier(.34,1.56,.64,1); }
        .quest-pin--hidden { background: rgba(255,255,255,0.22); box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        .quest-pin--found { width:26px; height:26px; margin:-5px 0 0 -5px; background: radial-gradient(circle at 35% 30%, #ffd6ec, #e879c9 55%, #b455d9); box-shadow: 0 0 0 6px rgba(232,121,201,0.25), 0 0 18px rgba(232,121,201,0.55); animation: questPop .5s cubic-bezier(.34,1.56,.64,1); }
        @keyframes questPop { 0%{ transform:scale(0.3); } 60%{ transform:scale(1.15); } 100%{ transform:scale(1); } }
        .leaflet-control-attribution { font-size: 9px !important; opacity: 0.55; }
        .leaflet-marker-pane { opacity: 0; transition: opacity 0.5s ease; }
        .map-tiles-ready .leaflet-marker-pane { opacity: 1; }
        .leaflet-tile-pane { filter: grayscale(0.5) brightness(1.18) contrast(0.88) saturate(1.05); }
        .leaflet-touch .leaflet-bar a { width: 40px !important; height: 40px !important; line-height: 40px !important; font-size: 18px !important; }
      `}</style>

      <div className="px-5 pt-6 pb-4 text-center shrink-0">
        <p className="text-xs uppercase tracking-[0.2em]" style={{color:"rgba(255,255,255,0.55)"}}>3 месяца вместе</p>
        <h1 className="text-2xl font-semibold mt-1" style={{fontFamily:"'Fraunces',serif",color:"#fff"}}>Наша карта Алматы</h1>
        <p className="text-sm mt-1.5" style={{color:"rgba(255,255,255,0.65)"}}>Найди на карте места, которые стали нашими.</p>
        <p className="text-xs mt-3 font-medium" style={{color:"#f4c9e8"}}>Найдено {found.size} из {QUEST_PLACES.length}</p>
      </div>

      <div className="flex-1 relative z-0 mx-4 mb-4 rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.15)"}}>
        <div ref={mapDivRef} className={`absolute inset-0 ${tilesReady ? "map-tiles-ready" : ""}`}/>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(135deg, rgba(255,182,222,0.28), rgba(196,155,255,0.22) 45%, rgba(154,196,255,0.24))",
          mixBlendMode: "soft-light",
        }}/>
      </div>

      {allFound && (
        <div className="px-5 pb-6 shrink-0 text-center">
          <div className="rounded-2xl p-5 mx-auto max-w-sm" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}>
            <p className="text-white font-medium mb-1" style={{fontFamily:"'Fraunces',serif"}}>Все места найдены</p>
            <p className="text-xs mb-4" style={{color:"rgba(255,255,255,0.7)"}}>Готова к следующему этапу?</p>
            <button onClick={onContinue} className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-85" style={{background:"#fff",color:"#7a3d8c"}}>
              Дальше →
            </button>
          </div>
        </div>
      )}

      {openPlace && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4" style={{background:"rgba(20,10,25,0.6)",paddingBottom:"max(1rem, env(safe-area-inset-bottom))"}} onClick={()=>setOpenPlace(null)}>
          <div className="rounded-2xl overflow-hidden w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl" style={{background:"#fdf5fb"}} onClick={e=>e.stopPropagation()}>
            {openMedia.length>0 && (
              <button
                onClick={()=>setLightboxIndex(0)}
                className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 relative"
                style={{background:"linear-gradient(160deg, #f6c9e8, #c9a8f0, #a8c6f0)",color:"rgba(90,40,90,0.55)",cursor:"pointer"}}
              >
                {openMedia[0].type==="video" ? (
                  <video src={openMedia[0].src} className="w-full h-full object-cover" muted autoPlay loop playsInline/>
                ) : (
                  <img src={openMedia[0].src} alt={openPlace.name} className="w-full h-full object-cover"/>
                )}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{background:"rgba(20,10,25,0.55)",color:"#fff"}}>
                  <ExpandIcon size={11}/>
                  {openMedia.length>1 ? `${openMedia.length} медиа` : "Открыть"}
                </div>
              </button>
            )}
            <div className="p-5">
              <div className="flex items-center gap-1.5 mb-1" style={{color:"#c9599b"}}>
                <HeartIcon size={14}/>
                <span className="text-[11px] font-semibold uppercase tracking-wide">Найдено</span>
              </div>
              <h3 className="text-lg font-semibold" style={{fontFamily:"'Fraunces',serif",color:"#3d2647"}}>{openPlace.name}</h3>
              <p className="text-sm mt-3 leading-relaxed" style={{color:"#5c4664"}}>
                {openPlace.memory || "Здесь будет ваша история об этом месте — впишите её в QUEST_PLACES."}
              </p>
              <button onClick={()=>setOpenPlace(null)} className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85" style={{background:"#e879c9",color:"#fff"}}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {openPlace && lightboxIndex !== null && openMedia.length > 0 && (
        <div
          className="fixed inset-0 z-[600] flex flex-col"
          style={{background:"rgba(10,5,15,0.96)"}}
          onClick={()=>setLightboxIndex(null)}
          onTouchStart={e=>{ (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={e=>{
            const startX = (e.currentTarget as any)._touchX;
            if (startX==null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (dx > 50) setLightboxIndex(i => i===null ? i : (i - 1 + openMedia.length) % openMedia.length);
            else if (dx < -50) setLightboxIndex(i => i===null ? i : (i + 1) % openMedia.length);
          }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0" onClick={e=>e.stopPropagation()}>
            <span className="text-sm" style={{color:"rgba(255,255,255,0.7)"}}>{openPlace.name} · {lightboxIndex+1}/{openMedia.length}</span>
            <button onClick={()=>setLightboxIndex(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.1)",color:"#fff"}}>
              <CloseIcon size={18}/>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-2" onClick={e=>e.stopPropagation()}>
            {openMedia.length>1 && (
              <button
                onClick={()=>setLightboxIndex(i => i===null ? i : (i - 1 + openMedia.length) % openMedia.length)}
                className="absolute left-2 sm:left-6 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{background:"rgba(255,255,255,0.1)",color:"#fff"}}
              ><ArrowIcon dir="left"/></button>
            )}
            {openMedia[lightboxIndex].type==="video" ? (
              <video src={openMedia[lightboxIndex].src} className="max-w-full max-h-full min-w-0 min-h-0 object-contain rounded-lg" controls autoPlay playsInline/>
            ) : (
              <img src={openMedia[lightboxIndex].src} alt={openPlace.name} className="max-w-full max-h-full min-w-0 min-h-0 object-contain rounded-lg"/>
            )}
            {openMedia.length>1 && (
              <button
                onClick={()=>setLightboxIndex(i => i===null ? i : (i + 1) % openMedia.length)}
                className="absolute right-2 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{background:"rgba(255,255,255,0.1)",color:"#fff"}}
              ><ArrowIcon dir="right"/></button>
            )}
          </div>
          {openMedia.length>1 && (
            <div className="flex justify-center gap-1.5 pb-6 pt-2 shrink-0" onClick={e=>e.stopPropagation()}>
              {openMedia.map((_,i)=>(
                <button key={i} onClick={()=>setLightboxIndex(i)} className="rounded-full transition-all" style={{width: i===lightboxIndex?18:6, height:6, background: i===lightboxIndex?"#e879c9":"rgba(255,255,255,0.3)"}}/>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function LockIcon({ size=18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
}
function MusicNoteIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>;
}
function PlayCircleIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9.3"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>;
}
function PauseCircleIcon({ size=20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9.3"/><path d="M10 9v6M14 9v6" strokeLinecap="round"/></svg>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MusicQuestScreen({ onContinue }: { onContinue: () => void }) {
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set(loadPersisted<string[]>("lyra-quest-unlocked", [])));
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [playerTrackId, setPlayerTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const allUnlocked = unlocked.size === MUSIC_TRACKS.length;

  useEffect(() => { savePersisted("lyra-quest-unlocked", Array.from(unlocked)); }, [unlocked]);

  const unlockedList = MUSIC_TRACKS.filter(t => unlocked.has(t.id));
  const playerTrack = MUSIC_TRACKS.find(t => t.id === playerTrackId) ?? null;

  // Lock background scroll — without this, dragging on this full-screen
  // takeover was scrolling the page underneath it.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function openGuess(track: MusicTrack) {
    if (unlocked.has(track.id)) return;
    // "Вальс" is a surprise — it must never appear as a decoy option for any
    // other track, only ever show up as a choice when it's the actual
    // correct answer being guessed (i.e. when `track` itself is "Вальс").
    const decoyPool = MUSIC_TRACKS.filter(t => t.id !== track.id && t.title !== "Вальс");
    const decoys = shuffle(decoyPool.map(t => t.title)).slice(0, 2);
    setChoices(shuffle([track.title, ...decoys]));
    setWrongPick(null);
    setActiveTrack(track);
  }

  function pick(choice: string) {
    if (!activeTrack) return;
    if (choice === activeTrack.title) {
      const unlockedTrack = activeTrack;
      setUnlocked(prev => new Set(prev).add(unlockedTrack.id));
      setActiveTrack(null);
      // Reward: jump straight into the player for the track just unlocked.
      setPlayerTrackId(unlockedTrack.id);
    } else {
      setWrongPick(choice);
    }
  }

  // Load + autoplay whenever the open player track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (!playerTrack?.audioSrc) return;

    const audio = new Audio(playerTrack.audioSrc);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => setIsPlaying(false);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));

    return () => { audio.pause(); };
  }, [playerTrackId]);

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { audio.play(); setIsPlaying(true); }
    else { audio.pause(); setIsPlaying(false); }
  }

  function seekTo(clientX: number) {
    const bar = barRef.current, audio = audioRef.current;
    if (!bar || !audio || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }

  function stepTrack(dir: 1 | -1) {
    if (!playerTrack || unlockedList.length < 2) return;
    const idx = unlockedList.findIndex(t => t.id === playerTrack.id);
    const next = unlockedList[(idx + dir + unlockedList.length) % unlockedList.length];
    setPlayerTrackId(next.id);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto" style={{background:"linear-gradient(160deg, #2a1f3d 0%, #3d2647 30%, #4a2f52 55%, #35304f 100%)",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div className="px-5 pt-8 pb-4 text-center shrink-0">
        <p className="text-xs uppercase tracking-[0.2em]" style={{color:"rgba(255,255,255,0.55)"}}>Наши песни</p>
        <h1 className="text-2xl font-semibold mt-1" style={{fontFamily:"'Fraunces',serif",color:"#fff"}}>Собери наш плейлист</h1>
        <p className="text-xs mt-3 font-medium" style={{color:"#f4c9e8"}}>Открыто {unlocked.size} из {MUSIC_TRACKS.length}</p>
      </div>

      <div className="flex-1 px-4 pb-6">
        <div className="grid gap-3 max-w-lg mx-auto" style={{gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))"}}>
          {MUSIC_TRACKS.map(track => {
            const isUnlocked = unlocked.has(track.id);
            return (
              <button
                key={track.id}
                onClick={()=> isUnlocked ? setPlayerTrackId(track.id) : openGuess(track)}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-transform hover:scale-[1.03]"
                style={isUnlocked
                  ? {background:"linear-gradient(160deg, #f6c9e8, #c9a8f0, #a8c6f0)", color:"#3d2647"}
                  : {background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)"}
                }
              >
                {isUnlocked ? (
                  <>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.5)"}}>
                      {playerTrackId===track.id && isPlaying ? <PauseCircleIcon size={26}/> : <PlayCircleIcon size={26}/>}
                    </div>
                    <span className="text-sm font-semibold leading-tight">{track.title}</span>
                    <span className="text-[11px]" style={{color:"#6b5476"}}>{track.artist}</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.08)"}}>
                      <LockIcon size={20}/>
                    </div>
                    <span className="text-xs font-medium">Трек {MUSIC_TRACKS.indexOf(track)+1}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {allUnlocked && (
        <div className="px-5 pb-8 shrink-0 text-center">
          <div className="rounded-2xl p-5 mx-auto max-w-sm" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}>
            <p className="text-white font-medium mb-1" style={{fontFamily:"'Fraunces',serif"}}>Плейлист собран</p>
            <p className="text-xs mb-4" style={{color:"rgba(255,255,255,0.7)"}}>Это наш шикарный blend.</p>
            <button onClick={onContinue} className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-85" style={{background:"#fff",color:"#7a3d8c"}}>
              Дальше →
            </button>
          </div>
        </div>
      )}

      {activeTrack && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4" style={{background:"rgba(20,10,25,0.6)",paddingBottom:"max(1rem, env(safe-area-inset-bottom))"}} onClick={()=>setActiveTrack(null)}>
          <div className="rounded-2xl overflow-hidden w-full max-w-sm p-5" style={{background:"#fdf5fb"}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-1.5 mb-3" style={{color:"#c9599b"}}>
              <MusicNoteIcon size={14}/>
              <span className="text-[11px] font-semibold uppercase tracking-wide">Угадай трек</span>
            </div>
            <p className="text-base italic leading-relaxed" style={{fontFamily:"'Fraunces',serif",color:"#3d2647"}}>«{activeTrack.clue}»</p>
            <div className="mt-5 flex flex-col gap-2">
              {choices.map(choice => (
                <button
                  key={choice}
                  onClick={()=>pick(choice)}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-left transition-colors"
                  style={wrongPick===choice
                    ? {background:"rgba(224,52,52,0.15)", color:"#c0392b", border:"1px solid rgba(224,52,52,0.3)"}
                    : {background:"rgba(0,0,0,0.04)", color:"#3d2647", border:"1px solid rgba(0,0,0,0.06)"}
                  }
                >
                  {choice}
                </button>
              ))}
            </div>
            {wrongPick && <p className="text-xs mt-3" style={{color:"#c0392b"}}>Не бурмалдит, попробуй ещё раз</p>}
            <button onClick={()=>setActiveTrack(null)} className="mt-4 w-full py-2 rounded-lg text-xs font-medium" style={{color:"#9d84a8"}}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {playerTrack && (
        <div
          className="fixed inset-0 z-[550] flex items-end sm:items-center justify-center p-4"
          style={{background:"rgba(20,10,25,0.75)",paddingBottom:"max(1rem, env(safe-area-inset-bottom))"}}
          onClick={()=>setPlayerTrackId(null)}
          onTouchStart={e=>{ (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={e=>{
            const startX = (e.currentTarget as any)._touchX;
            if (startX==null || unlockedList.length<2) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (dx > 50) stepTrack(-1);
            else if (dx < -50) stepTrack(1);
          }}
        >
          <div className="rounded-2xl overflow-hidden w-full max-w-sm" style={{background:"#fdf5fb"}} onClick={e=>e.stopPropagation()}>
            <div className="flex justify-end p-3">
              <button onClick={()=>setPlayerTrackId(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:"rgba(0,0,0,0.06)",color:"#5c4664"}}>
                <CloseIcon size={16}/>
              </button>
            </div>
            <div className="px-8 flex flex-col items-center">
              <div
                className="w-48 h-48 rounded-full flex items-center justify-center mb-6 transition-transform"
                style={{
                  background: "conic-gradient(from 180deg, #f6c9e8, #c9a8f0, #a8c6f0, #f6c9e8)",
                  boxShadow: isPlaying ? "0 0 0 10px rgba(232,121,201,0.15), 0 20px 40px rgba(120,60,140,0.3)" : "0 12px 30px rgba(120,60,140,0.2)",
                  animation: isPlaying ? "questSpin 14s linear infinite" : "none",
                }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background:"#fdf5fb"}}>
                  <MusicNoteIcon size={26}/>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center" style={{fontFamily:"'Fraunces',serif",color:"#3d2647"}}>{playerTrack.title}</h3>
              <p className="text-sm mt-0.5" style={{color:"#9d84a8"}}>{playerTrack.artist}</p>

              {playerTrack.audioSrc ? (
                <>
                  <div
                    ref={barRef}
                    onClick={e=>seekTo(e.clientX)}
                    className="w-full h-1.5 rounded-full mt-6 cursor-pointer"
                    style={{background:"rgba(0,0,0,0.08)"}}
                  >
                    <div className="h-full rounded-full" style={{width:`${duration?(currentTime/duration)*100:0}%`,background:"linear-gradient(90deg, #e879c9, #a78bfa)"}}/>
                  </div>
                  <div className="w-full flex justify-between text-[11px] mt-1.5" style={{color:"#b09ab8"}}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs mt-6" style={{color:"#b09ab8"}}>Аудио скоро появится здесь</p>
              )}

              <div className="flex items-center justify-center gap-6 my-6">
                <button onClick={()=>stepTrack(-1)} disabled={unlockedList.length<2} className="transition-opacity" style={{color:"#7a5c86",opacity:unlockedList.length<2?0.3:1}}>
                  <ArrowIcon dir="left" size={22}/>
                </button>
                <button
                  onClick={togglePlayPause}
                  disabled={!playerTrack.audioSrc}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-opacity"
                  style={{background:"#e879c9",color:"#fff",opacity:playerTrack.audioSrc?1:0.4}}
                >
                  {isPlaying ? <PauseCircleIcon size={26}/> : <PlayCircleIcon size={26}/>}
                </button>
                <button onClick={()=>stepTrack(1)} disabled={unlockedList.length<2} className="transition-opacity" style={{color:"#7a5c86",opacity:unlockedList.length<2?0.3:1}}>
                  <ArrowIcon dir="right" size={22}/>
                </button>
              </div>
            </div>
            <div className="h-4"/>
          </div>
          <style>{`@keyframes questSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}


function PendantIcon({ size=28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5c0 4.2 3.6 7 8 7s8-2.8 8-7"/><path d="M12 11.5v2.3"/><path d="M12 13.8l3.4 3.4-3.4 3.4-3.4-3.4z"/></svg>;
}
function BraceletIcon({ size=28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="12" rx="8.5" ry="6.5"/><circle cx="4.2" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19.8" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="17.5" r="1" fill="currentColor" stroke="none"/></svg>;
}
function RingIcon({ size=28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="14.5" r="6"/><path d="M9.5 8.5L12 3l2.5 5.5-2.5 2z" strokeLinejoin="round"/></svg>;
}
function TicketIcon({ size=28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v1.5a1.5 1.5 0 000 3V15a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.5a1.5 1.5 0 000-3z"/><path d="M14 7v10" strokeDasharray="2 2"/></svg>;
}

// EmailJS — sends the chosen keepsake to email when the /final screen is
// answered. dashboard.emailjs.com → Email Services / Templates / Account.
const EMAILJS_SERVICE_ID = "service_i80jrow";
const EMAILJS_TEMPLATE_ID = "template_uj59hhq";
const EMAILJS_PUBLIC_KEY = "BgSJ3M5ZBC81RfXgC";

const KEEPSAKE_OPTIONS: { id: string; label: string; icon: (props:{size?:number})=>JSX.Element }[] = [
  { id: "bracelet", label: "Браслет", icon: BraceletIcon },
  { id: "ring", label: "Кольцо", icon: RingIcon },
  { id: "pendant", label: "Кулон", icon: PendantIcon },
];

function FinalStageScreen({ onContinue }: { onContinue: () => void }) {
  const [picked, setPicked] = useState<string | null>(() => loadPersisted<string | null>("lyra-quest-picked", null));
  const [sent, setSent] = useState(() => loadPersisted<boolean>("lyra-quest-sent", false));

  useEffect(() => { savePersisted("lyra-quest-picked", picked); }, [picked]);
  useEffect(() => { savePersisted("lyra-quest-sent", sent); }, [sent]);

  // Lock background scroll — without this, dragging on this full-screen
  // takeover was scrolling the page underneath it.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function choose(id: string, label: string) {
    if (picked) return;
    setPicked(id);
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { choice: label }, { publicKey: EMAILJS_PUBLIC_KEY })
        .then(()=>setSent(true))
        .catch(()=>setSent(true)); // fail silently either way — she never sees an error
    } else {
      setSent(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center px-6" style={{background:"linear-gradient(160deg, #2a1f3d 0%, #3d2647 30%, #4a2f52 55%, #35304f 100%)",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <p className="text-xs uppercase tracking-[0.2em]" style={{color:"rgba(255,255,255,0.55)"}}>Ещё один момент</p>
      <h1 className="text-2xl font-semibold mt-2 max-w-sm" style={{fontFamily:"'Fraunces',serif",color:"#fff"}}>Один маленький вопрос для меня</h1>
      <p className="text-sm mt-2 max-w-xs" style={{color:"rgba(255,255,255,0.65)"}}>Если бы кусочек нашей с тобой истории можно было сохранить навсегда в одной вещи - какой бы она была?</p>

      {!sent ? (
        <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-xs">
          {KEEPSAKE_OPTIONS.slice(0,2).map(opt => {
            const Icon = opt.icon;
            const isPicked = picked === opt.id;
            return (
              <button
                key={opt.id}
                onClick={()=>choose(opt.id, opt.label)}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-transform hover:scale-[1.03]"
                style={isPicked
                  ? {background:"linear-gradient(160deg, #f6c9e8, #c9a8f0, #a8c6f0)", color:"#3d2647"}
                  : {background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.75)"}
                }
              >
                <Icon size={26}/>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
          {KEEPSAKE_OPTIONS.slice(2).map(opt => {
            const Icon = opt.icon;
            const isPicked = picked === opt.id;
            return (
              <button
                key={opt.id}
                onClick={()=>choose(opt.id, opt.label)}
                className="col-span-2 rounded-2xl p-5 flex flex-col items-center gap-2.5 transition-transform hover:scale-[1.03]"
                style={isPicked
                  ? {background:"linear-gradient(160deg, #f6c9e8, #c9a8f0, #a8c6f0)", color:"#3d2647"}
                  : {background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.75)"}
                }
              >
                <Icon size={34}/>
                <span className="text-base font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl p-5 max-w-xs" style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",backdropFilter:"blur(10px)"}}>
          <p className="text-white font-medium" style={{fontFamily:"'Fraunces',serif"}}>Запомнил</p>
          <p className="text-xs mt-1 mb-4" style={{color:"rgba(255,255,255,0.7)"}}>Спасибо, что дошла до конца.</p>
          <button onClick={onContinue} className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-85" style={{background:"#fff",color:"#7a3d8c"}}>
            Дальше →
          </button>
        </div>
      )}
    </div>
  );
}

function CertificateRevealScreen() {
  const [revealed, setRevealed] = useState(() => loadPersisted<boolean>("lyra-quest-revealed", false));

  useEffect(() => { savePersisted("lyra-quest-revealed", revealed); }, [revealed]);


  // Lock background scroll — without this, dragging on this full-screen
  // takeover was scrolling the page underneath it.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center px-6 overflow-y-auto" style={{background:"linear-gradient(160deg, #2a1f3d 0%, #3d2647 30%, #4a2f52 55%, #35304f 100%)",paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)",overscrollBehavior:"contain"}}>
      <style>{`@keyframes certFadeIn { from { opacity:0; transform: scale(0.94) translateY(12px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>
      {!revealed ? (
        <button onClick={()=>setRevealed(true)} className="flex flex-col items-center gap-6 py-10">
          <p className="text-xs uppercase tracking-[0.2em]" style={{color:"rgba(255,255,255,0.55)"}}>Финал</p>
          <h1 className="text-2xl font-semibold max-w-xs leading-snug" style={{fontFamily:"'Fraunces',serif",color:"#fff"}}>Вот и билет на наше с тобой сегодняшнее свидание</h1>
          <div className="w-56 rounded-2xl p-6 flex flex-col items-center gap-3 transition-transform hover:scale-[1.03]" style={{background:"rgba(255,255,255,0.08)",border:"1.5px dashed rgba(255,255,255,0.3)",color:"#f4c9e8"}}>
            <TicketIcon size={30}/>
            <span className="text-sm" style={{color:"rgba(255,255,255,0.75)"}}>Нажми, чтобы открыть</span>
          </div>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-5 py-10 w-full" style={{animation:"certFadeIn 0.6s ease"}}>
          <p className="text-sm max-w-xs" style={{color:"rgba(255,255,255,0.75)"}}>Вот и билет на наше с тобой сегодняшнее свидание</p>
          <img
            src={certificateImg}
            alt="Подарочный сертификат"
            className="rounded-2xl w-full max-w-xs"
            style={{boxShadow:"0 25px 60px rgba(0,0,0,0.5)"}}
          />
          <p className="text-sm font-medium" style={{fontFamily:"'Fraunces',serif",color:"#f4c9e8"}}>Мы записаны на 3 сентября, 17:00</p>
        </div>
      )}
    </div>
  );
}


// ── Simple path-based routing (testing aid) ─────────────────────────────────
// No router library — just enough to open any stage directly by URL instead
// of always replaying the whole quest from the seat-booking step.
type Page = "home" | "locations" | "playlist" | "final" | "ticket";

function pathToPage(pathname: string): Page {
  switch (pathname.replace(/\/+$/, "")) {
    case "/locations": return "locations";
    case "/playlist": return "playlist";
    case "/final": return "final";
    case "/ticket": return "ticket";
    default: return "home";
  }
}
function pageToPath(page: Page): string {
  return page === "home" ? "/home" : `/${page}`;
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);
  const [genre, setGenre] = useState("Все");
  const [search, setSearch] = useState("");

  // Modal state machine: null → detail → seat
  const [detailMovie, setDetailMovie] = useState<Movie|null>(null);
  const [seatState, setSeatState] = useState<{movie:Movie;time:string;date:Date}|null>(null);

  // Which full-screen "stage" is showing, driven by the URL path so each one
  // can be opened directly for testing (domain.com/locations, /playlist, …)
  // instead of always replaying the whole quest from the start. A bare "/"
  // or "/home" load falls back to whatever stage was last reached (if
  // reasonably recent) instead of always dumping her back at square one.
  const [page, setPage] = useState<Page>(() => {
    const urlPage = pathToPage(window.location.pathname);
    return urlPage !== "home" ? urlPage : loadPersisted<Page>("lyra-quest-page", "home");
  });

  useEffect(() => {
    const onPopState = () => setPage(pathToPage(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Sync the URL to match the initial page once on mount — covers both the
    // plain "/" → "/home" normalization and resuming a persisted later stage.
    const path = pageToPath(page);
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  useEffect(() => { savePersisted("lyra-quest-page", page); }, [page]);

  function navigate(next: Page) {
    const path = pageToPath(next);
    if (window.location.pathname !== path) window.history.pushState(null, "", path);
    setPage(next);
  }

  const filteredMovies = useMemo(()=>MOVIES.filter(m=>{
    if (genre!=="Все" && m.genre!==genre) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[genre,search]);

  const dateKey = fmtDate(selectedDate);
  const visibleMovies = useMemo(()=>filteredMovies.filter(m=>m.id!==7 || dateKey===SPECIAL_DATE),[filteredMovies,dateKey]);
  const moviesWithSessions    = visibleMovies.filter(m=>(m.sessions[dateKey]??[]).length>0);
  const moviesWithoutSessions = visibleMovies.filter(m=>(m.sessions[dateKey]??[]).length===0);
  const past = isPast(selectedDate);
  const special = isSpecial(selectedDate);
  const inStrip = DATE_RANGE.some(d=>fmtDate(d)===dateKey);

  return (
    <div className="min-h-full" style={{background:"#0b0b0f",fontFamily:"'Work Sans',sans-serif"}}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 md:px-8" style={{background:"rgba(11,11,15,0.92)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 gap-4">
          <a href="#" style={{fontFamily:"'Fraunces',serif",color:"#f0eee9",textDecoration:"none"}} className="shrink-0">
            <span style={{color:"#e03434",fontSize:22,fontWeight:700}}>AD</span>
            <span style={{fontSize:22,fontWeight:300,letterSpacing:"0.05em"}}>CINEMA</span>
          </a>
          <div className="flex-1 max-w-xs">
            <input type="text" placeholder="Поиск фильмов..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full rounded-lg px-3 py-1.5 outline-none transition-all"
              style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#f0eee9",fontSize:16}}
              onFocus={e=>(e.target as HTMLInputElement).style.borderColor="rgba(224,52,52,0.5)"}
              onBlur={e=>(e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.1)"}
            />
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{color:"#7d7a73"}}>
            {["Акции","О нас","Контакты"].map(item=>(
              <a key={item} href="#" className="hover:text-white transition-colors" style={{textDecoration:"none",color:"inherit"}}>{item}</a>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{height:200}}>
        <img src="https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=1400&h=300&fit=crop&auto=format" alt="Cinema" className="w-full h-full object-cover" style={{opacity:0.4}}/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{background:"linear-gradient(to bottom, rgba(11,11,15,0.3), rgba(11,11,15,0.8))"}}>
          <h1 className="text-4xl md:text-5xl font-semibold mb-2" style={{fontFamily:"'Fraunces',serif",color:"#f0eee9"}}>Выберите сеанс</h1>
          <p className="text-sm" style={{color:"#9d9a93"}}>Более {MOVIES.length} фильмов в прокате · Онлайн-бронирование мест</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky z-30 px-4 md:px-8 py-3" style={{top:56,background:"#0b0b0f",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wider" style={{color:"#4a4845"}}>Дата сеанса</p>
              <div className="flex items-center gap-2">
                {!isToday(selectedDate) && (
                  <button onClick={()=>setSelectedDate(TODAY)} className="text-xs transition-colors" style={{color:"#e03434"}}>Сегодня</button>
                )}
                <CalendarPicker selected={selectedDate} onSelect={setSelectedDate}/>
              </div>
            </div>
            <DateStrip dates={DATE_RANGE} selected={inStrip?selectedDate:new Date(0)} onSelect={setSelectedDate}/>
            {!inStrip && (
              <div className="mt-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 w-fit" style={{background:"rgba(244,162,97,0.1)",border:"1px solid rgba(244,162,97,0.25)",color:"#f4a261"}}>
                <CalendarIcon/>
                Архивная дата: {selectedDate.getDate()} {RU_MONTHS_L[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {GENRES.map(g=>(
                <button key={g} onClick={()=>setGenre(g)} className="text-xs px-3 py-1 rounded-full transition-all"
                  style={genre===g?{background:"#e03434",color:"#fff"}:{background:"rgba(255,255,255,0.06)",color:"#9d9a93",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {past && !special && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-3" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#7d7a73"}}>
            <span><CalendarIcon/></span>
            <span>Архив за {selectedDate.getDate()} {RU_MONTHS_L[selectedDate.getMonth()]} {selectedDate.getFullYear()}. Покупка билетов недоступна.</span>
          </div>
        )}
        {special && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-3" style={{background:"rgba(244,162,97,0.08)",border:"1px solid rgba(244,162,97,0.2)",color:"#f4a261"}}>
            <span><FilmReelIcon size={16}/></span>
            <span>Специальный архивный показ</span>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-semibold" style={{fontFamily:"'Fraunces',serif",color:"#f0eee9"}}>
            {selectedDate.getDate()} {RU_MONTHS_L[selectedDate.getMonth()]}
            {isToday(selectedDate) && (
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{background:"rgba(244,162,97,0.15)",color:"#f4a261",fontFamily:"'Work Sans',sans-serif"}}>Сегодня</span>
            )}
          </h2>
          <span className="text-sm" style={{color:"#4a4845"}}>
            {moviesWithSessions.length} {moviesWithSessions.length===1?"фильм":moviesWithSessions.length<5?"фильма":"фильмов"} с сеансами
          </span>
        </div>

        {visibleMovies.length===0 ? (
          <div className="text-center py-20" style={{color:"#4a4845"}}>
          <div className="flex justify-center mb-3" style={{color:"#3a3a3a"}}><SearchOffIcon/></div>
            <p className="text-lg" style={{fontFamily:"'Fraunces',serif"}}>Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <>
            {moviesWithSessions.length>0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mb-10">
                {moviesWithSessions.map(m=>(
                  <MovieCard key={m.id} movie={m} selectedDate={selectedDate} onOpen={setDetailMovie}/>
                ))}
              </div>
            )}
            {moviesWithoutSessions.length>0 && (
              <>
                {moviesWithSessions.length>0 && <div className="mb-5" style={{height:1,background:"rgba(255,255,255,0.06)"}}/>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5" style={{opacity:0.42}}>
                  {moviesWithoutSessions.map(m=>(
                    <MovieCard key={m.id} movie={m} selectedDate={selectedDate} onOpen={setDetailMovie}/>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="mt-16 px-4 md:px-8 py-8 text-center text-xs" style={{color:"#4a4845",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <p style={{fontFamily:"'Fraunces',serif",fontSize:16,color:"#7d7a73",marginBottom:8}}>
          <span style={{color:"#e03434"}}>AD</span>CINEMA
        </p>
        <p>© {TODAY.getFullYear()} ADCinema. Все права защищены.</p>
        <p className="mt-1">Алматы, ул. Навои 208/2</p>
      </footer>

      {/* Movie detail modal */}
      {detailMovie && !seatState && (
        <MovieDetailModal
          movie={detailMovie}
          initialDate={selectedDate}
          onClose={()=>setDetailMovie(null)}
          onBookSeat={(movie,time,date)=>{setDetailMovie(null); setSeatState({movie,time,date});}}
        />
      )}

      {/* Seat modal */}
      {seatState && (
        <SeatModal
          movie={seatState.movie}
          time={seatState.time}
          date={seatState.date}
          onClose={()=>setSeatState(null)}
          onBack={()=>{setSeatState(null); setDetailMovie(seatState.movie);}}
          onQuestUnlock={()=>{setSeatState(null); navigate("locations");}}
        />
      )}

      {/* Quest map (special screening surprise) */}
      {page==="locations" && <QuestMapScreen onContinue={()=>navigate("playlist")}/>}

      {/* Music quest (stage 2) */}
      {page==="playlist" && <MusicQuestScreen onContinue={()=>navigate("final")}/>}

      {/* Final stage (stub, before the prize reveal) */}
      {page==="final" && <FinalStageScreen onContinue={()=>navigate("ticket")}/>}

      {/* Certificate reveal (the actual gift) */}
      {page==="ticket" && <CertificateRevealScreen/>}
    </div>
  );
}
