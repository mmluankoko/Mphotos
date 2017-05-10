const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const fs = require('fs')
const path = require('path')
const storage = require('electron-json-storage')
const Config = require('electron-config')
const managerConfig = new Config({name:'managerConfig'})
const library = new Config({name:'library'})
const mdc = require('../node_modules/material-components-web/dist/material-components-web.js')





// Menu operations
menuOps = {}
menuOps.import_images = () => {
  console.log('menuOps.import_images')
  ipc.send('import_images')
}
menuOps.import_folders = () => {
  console.log('menuOps.import_folders')
  ipc.send('import_folders')
}
menuOps.quit = () => {
  console.log('menuOps.quit')
  ipc.send('quit', '')
}
menuOps.close = () => {
  console.log('menuOps.close')
  remote.getCurrentWindow().close()
}

// IPC handlers
ipc.on('import_folders-back', function (event, dirs) {
  for (let i = 0; i < dirs.length; i++) {
    let images = fs.readdirSync(dirs[i]).filter(isImage)
    for (let j = 0; j < images.length; j++) {
      images[j] = path.join(dirs[i],images[j])
    }
    addImages(images)
  }
})
ipc.on('import_images-back', function (event, files) {
  addImages(files)
})

$(document).ready(() => init())
function init(){
  // read or initialize config
  if (!managerConfig.has('imageSize')) {
    managerConfig.set('imageSize','100px')
  }
  // UI initialization
  $('.mdc-list-item').click(function(){
    $('.mdc-list-item').removeClass('mdc-permanent-drawer--selected')
    $(this).addClass('mdc-permanent-drawer--selected')
  })
  $('.mdc-grid-tile').css('width',managerConfig.get('imageSize'))
  $('#zoom_in').click(() => zoom('in'))
  $('#zoom_out').click(() => zoom('out'))
  let menu = new mdc.menu.MDCSimpleMenu(document.querySelector('.mdc-simple-menu'))
  $('#menu').click(() => menu.open = !menu.open);
  let menuEl = document.querySelector('.mdc-simple-menu');
  menuEl.addEventListener('MDCSimpleMenu:selected', function(evt) {
          let detail = evt.detail
          let op = $(detail.item).attr('name')
          console.log(op)
          menuOps[op]()
          // let textContent = '"' + detail.item.textContent.trim() +
          //   '" at index ' + detail.index;
          // console.log(textContent)
          // menuOps[]
        });
}



// for (let i = 0; i <10; i++) {
//   addImage('photo.jpg')
// }




function zoom(op){
  let sz = parseInt(managerConfig.get('imageSize').replace('px',''))
  if (op==='in') {
    sz += 20
    if (sz > 300) sz = 300
  }
  if (op==='out') {
    sz -= 20
    if (sz < 100) sz = 100
  }
  sz += 'px'
  $('.mdc-grid-tile').css('width',sz)
  managerConfig.set('imageSize',sz)
}

function addImages(urls){
  for (let i = 0; i < urls.length; i++) {
    addImage(urls[i])
  }
}
function addImage(url){
  let image = '<li class="mdc-grid-tile" style="width: '+ managerConfig.get('imageSize') +'">' +
            '<div class="mdc-grid-tile__primary">' +
               '<div style="background-image: url('+ url +');" class="mdc-grid-tile__primary-content" /></div>' +
               '</div></li>'
  $('#images').append(image)
}
function isEmptyObj(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}
function isImage(file){
  let imgExts = ['png','jpg','jpeg','png']
  let ext = file.slice(file.lastIndexOf('.')+1).toLowerCase()
  return imgExts.includes(ext)
}
