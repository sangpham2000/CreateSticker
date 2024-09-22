import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

//Main UI
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

//Editor
import CKEditor from '@ckeditor/ckeditor5-vue'

//Notifications
import { createNotivue } from 'notivue'
import 'notivue/notifications.css' // Only needed if using built-in notifications
import 'notivue/animations.css' // Only needed if using built-in animations

//Multi Language
import { createI18n } from 'vue-i18n'

import messages from './i18n/messages'
import numberFormats from './i18n/numberFormats'

const app = createApp(App)
const notivue = createNotivue({
  position: 'top-center',
  limit: 2,
  enqueue: false,
  notifications: {
    global: {
      duration: 3000
    }
  }
})
const i18n = createI18n({
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
  numberFormats
  // If you need to specify other options, you can set other options
  // ...
})

app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(CKEditor)
app.use(notivue)
app.use(i18n)

app.mount('#app')
