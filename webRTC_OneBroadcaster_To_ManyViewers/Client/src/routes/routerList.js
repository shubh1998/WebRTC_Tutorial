import { DragonTigerBroadcast } from '../pages/DragonTiger/BroadCast/DragonTigerBroadcast'
import { DragonTigerViewer } from '../pages/DragonTiger/Viewer/DragonTigerViewer'
import { Home } from '../pages/Home/Home'

const routerList = [
  {
    key: 1,
    label: 'Home',
    path: '/',
    component: Home,
    hasNavbar: true
  },
  {
    key: 2,
    label: 'broadcast-stream',
    path: '/broadcast-stream',
    component: DragonTigerBroadcast,
    hasNavbar: true
  },
  {
    key: 3,
    label: 'viewers',
    path: '/viewers',
    component: DragonTigerViewer,
    hasNavbar: true
  }
]

export default routerList
