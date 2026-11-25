import {chineseText as c} from "./chinese-text.js";

var Zg = {
    fire: `burn`,
    water: `wet`,
    electric: `paralysis`,
    ice: `freeze`,
    poison: `poison`,
    grass: `root`,
    psychic: `confusion`,
    ghost: `curse`,
    dark: `healblock`,
    fairy: `charm`,
    fighting: `knock`,
    rock: `stun`,
    ground: `stun`,
    flying: `knock`,
    bug: `poison`,
    dragon: null,
    steel: `knock`,
    normal: null,
  },
  Qg = {
    burn: c(`Quemado`),
    poison: c(`Envenenado`),
    paralysis: c(`Paralizado`),
    freeze: c(`Congelado`),
    sleep: c(`Dormido`),
    confusion: c(`Confuso`),
    wet: c(`Mojado`),
    curse: c(`Maldito`),
    healblock: c(`Anticura`),
    charm: c(`Encantado`),
    root: c(`Enraizado`),
    knock: c(`Retroceso`),
    stun: c(`Aturdido`),
  };
function $g(e) {
  switch (e) {
    case `burn`:
      return `burn`;
    case `poison`:
      return `poison`;
    case `paralysis`:
      return `paralysis`;
    case `freeze`:
      return `freeze`;
    case `sleep`:
    case `yawn`:
      return `sleep`;
    case `confusion`:
      return `confusion`;
    case `trap`:
      return `root`;
    case `leech-seed`:
      return `root`;
    case `heal-block`:
    case `embargo`:
      return `healblock`;
    case `infatuation`:
      return `charm`;
    case `nightmare`:
      return `curse`;
    default:
      return null;
  }
}

export {
  Zg,
  $g,
  Qg
};
