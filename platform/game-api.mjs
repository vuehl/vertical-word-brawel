import crypto from './crypto.mjs';
import {readStore,writeStore} from './store.mjs';
import {progressDispatcher,callProgress} from './cloud-progress.mjs';
import {localRoute} from '../source/local/game-routes.mjs';

const dispatch=progressDispatcher({load:readStore,save:writeStore,call:__LOCAL_PROGRESS_ONLY__ ? null : callProgress,
  mutationID:()=>crypto.randomBytes(16).toString("hex"),localRoute});
let queue=Promise.resolve();
export function dispatchApi(...args){
  const next=queue.then(()=>dispatch(...args));
  queue=next.catch(()=>{});
  return next;
}
