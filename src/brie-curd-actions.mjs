import {approachPatron} from './slot-reactions.mjs';

export function createBrieCurdActions(brie, staff, guests, baron, player, guards, clubEvent, karma) {
  let baronRun = null;
  return {
    handle(action, elapsed) {
      if (action === 'brieCurdSlap') {
        clubEvent('Brie slaps Pip.', () => karma.change(-0.5));
      } else if (action === 'brieRunToBaron') {
        brie.serviceDuty = true;
        baronRun = {route: [], waiter: true};
      } else if (action === 'brieDepart' && !brie.departing) {
        Object.assign(brie, {
          departing: true, rushingOffscreen: true, serviceDuty: false,
          target: null, route: [], pauseUntil: elapsed,
          departureOrigin: {x: player.x, y: player.y},
          departureSpeech: 'KARL!! HOW COULD YOU?!'
        });
      }
    },
    isUnavailable: () => Boolean(brie.departing || baronRun),
    update(elapsed, dt) {
      if (baronRun) {
        if (Math.hypot(brie.x - baron.x, brie.y - baron.y) <= 56) {
          baronRun = null;
          Object.assign(brie, {serviceDuty: false, target: null, route: [], pauseUntil: elapsed + 0.75, walking: false});
        } else {
          approachPatron(brie, baronRun, baron, baron, [player, ...staff, ...guards], dt, 180);
        }
      }
      if (brie.departing && !brie.rushingOffscreen && staff.includes(brie)) {
        staff.splice(staff.indexOf(brie), 1);
        const guestIndex = guests.indexOf(brie);
        if (guestIndex >= 0) guests.splice(guestIndex, 1);
        clubEvent('Your knowledge of political history has ruined an entirely unrelated relationship.', () => karma.change(-1));
      }
    }
  };
}
