export const multiplayerConfig = Object.freeze({
  env: 'prod-d9ghzhiajc8a4786f',
  service: 'golang-lv1m',
  protocol: 2,
  build: 'ziling-portrait-monsters-1',
});

// 从微信小游戏后台同一张已过审的分享图片复制这两项。留空使用微信默认封面。
export const roomShareImage = Object.freeze({
  imageUrlId: '',
  imageUrl: '',
});

export function roomInviteCard(code,{imageUrlId,imageUrl}=roomShareImage) {
  const card={title:'来字行和我组队吧！房间号 '+code,query:'roomCode='+code};
  if(imageUrlId && imageUrl)Object.assign(card,{imageUrlId,imageUrl});
  return card;
}
