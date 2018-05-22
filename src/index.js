import _ from 'lodash'
import Papa from 'papaparse'
import { env } from './modules/config'
import { LookForDiffs } from './modules/lookForDiffs'
import * as admin from 'firebase-admin'

/** *** FIREBASE *****/

// Fetch the service account key JSON file contents
var serviceAccount = require('./../firestore-test-1-todo-firebase-adminsdk-wzads-030e47b3cf.json')

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://firestore-test-1-todo.firebaseio.com'
})

// As an admin, the app has access to read and write all data, regardless of Security Rules
var fireDB = admin.database()
var refProducts = fireDB.ref('products/')

/** *** end FIREBASE *****/

const fs = require('fs')
let lookForDiffs = new LookForDiffs(fireDB)

// TODO !!!!!!!!!!!!
// seguir con l lectura de los datos de firebase, necesito recorrer los datos y pasarlos de un objeto
// a un array de objetos q contenga cada uno de los productos, ensayar que imprimer un _.each

setInterval(() => {
  let fileStream = fs.createReadStream(env.prods_sap_file) // path.resolve(os.tmpdir(), 'fz3temp-3', 'product.txt')
  Papa.parse(fileStream, {
    header: true,
    complete: csvParsed => {
      // Attach an asynchronous callback to read the data at our posts reference
      refProducts.orderByKey().once('value', snapshot => {
        const productos = snapshot.val()
        console.log('cantidad de firebase', Object.keys(productos).length)

        lookForDiffs.checkAndResolve(_.filter(csvParsed.data, ['_delete', 'false']), productos).then(res => {
          console.log('prods actualizados', res)
        }).catch(err => {
          console.error('Puto error no previsto', err)
        })
      }, errorObject => {
        console.log('The read failed: ' + errorObject.code)
      })
      fileStream.destroy()
    },
    error: err => {
      console.error('Puto error', err)
      fileStream.destroy()
    }
  })
}, 600000)
