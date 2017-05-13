const fs = require('fs')
const path = require('path')

const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote

const storage = require('electron-json-storage')
const Config = require('electron-config')
const open = require('opn');

const mdc = require('../node_modules/material-components-web/dist/material-components-web.js')

const managerConfig = new Config({name:'managerConfig'})
const library = new Config({name:'library'})

let snackbar, curContextMenuItem, dialog_side_new

// Menu operations
let menuOps = {}
menuOps.import_images = () => {
  console.log('menuOps.import_images')
  ipc.send('import_images')
}
menuOps.import_folders = () => {
  console.log('menuOps.import_folders')
  ipc.send('import_folders')
}
menuOps.remove_all_images = () => {
  console.log('menuOps.remove_all_images')
  removeAllImages()
}
menuOps.quit = () => {
  console.log('menuOps.quit')
  ipc.send('quit', '')
}
menuOps.close = () => {
  console.log('menuOps.close')
  remote.getCurrentWindow().close()
}
menuOps.debug_lib = () => {
  console.log(library.store)
}

let contextMenuOps = {}
contextMenuOps.side_new = () => {
  console.log('contextMenuOps.side_new')
  $('#dialog_side_new input').parent().removeClass('mdc-textfield--invalid')
  $('#dialog_side_new input').val('')
  dialog_side_new.show()
}
contextMenuOps.image_open = () => {
  console.log('contextMenuOps.image_open')
  open(curContextMenuItem.attr('src'))
}
contextMenuOps.image_open_folder = () => {
  console.log('contextMenuOps.image_open_folder')
  open(path.dirname(curContextMenuItem.attr('src')))
}
contextMenuOps.image_remove_from_lib = () => {
  console.log('contextMenuOps.image_remove_from_lib')
  removeImage(curContextMenuItem.attr('src'))
  curContextMenuItem.parent().parent().remove()
}
contextMenuOps.image_remove_from_disk = () => {
  console.log('contextMenuOps.image_remove_from_disk')
  // (curContextMenuItem.attr('src'))
}
contextMenuOps.move_to = (c) => {
  console.log('contextMenuOps.move_to('+c+')')
  let tmp = library.get(c)
  let u = curContextMenuItem.attr('src')
  if (!tmp.includes(u)) {
    tmp.push(u)
    showSnackbar('1 image moved to ' + c +'.')
    library.set(c,tmp)
  } else {
    showSnackbar('0 image moved. (already there)')
  }
}

// Initialization
$(document).ready(() => init())
function init(){
  // read or initialize config
  if (!managerConfig.has('imageSize')) {
    managerConfig.set('imageSize','100px')
  }
  if (!library.has('all')) {
    library.set('all',[])
  }
  // UI initialization
  for (let key in library.store) {
    let cat = $('<a class="mdc-list-item contextMenu_sideItemButton" href="#'+key+'">'+
                 '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true">photo_library</i>'+
                 '<p data-cat="'+key+'">'+key+'</p>' +
                 '</a>')
    if (key === 'all') {
      cat.addClass('mdc-permanent-drawer--selected')
    } else {
      let contextCat = $('<li class="mdc-list-item" role="menuitem" tabindex="0" data-cat="'+key+'"name="move_to">Move To '+key+'</li>')
      $('#image_context_menu').append(contextCat)
    }
    cat.click(function(){
      $('#side .mdc-list-item').removeClass('mdc-permanent-drawer--selected')
      $(this).addClass('mdc-permanent-drawer--selected')
    })
    $('#side_items').append(cat)
  }

  $('.mdc-grid-tile').css('width',managerConfig.get('imageSize'))
  $('#zoom_in').click(() => zoom('in'))
  $('#zoom_out').click(() => zoom('out'))

  // Snackbar
  snackbar = new mdc.snackbar.MDCSnackbar(document.getElementById('snackbar'));

  // Menu
  let menu = new mdc.menu.MDCSimpleMenu(document.querySelector('.menu'))
  $('.menuButton').click(() => menu.open = !menu.open);
  document.querySelector('.menu').addEventListener('MDCSimpleMenu:selected', function(evt) {
          let detail = evt.detail
          let op = $(detail.item).attr('name')
          console.log(detail.item.textContent.trim())
          menuOps[op]()
  });

  // Context menus
  let contextMenu_side = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_side'))
  let contextMenu_sideItem = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_sideItem'))
  let contextMenu_image = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_image'))
  for (let m of document.querySelectorAll('.contextMenu')) {
    m.addEventListener('MDCSimpleMenu:selected', function(evt) {
            let detail = evt.detail
            let op = $(detail.item).attr('name')
            console.log(detail.item.textContent.trim())
            if (op==='move_to') {
              let cat = $(detail.item).attr('data-cat')
              contextMenuOps['move_to'](cat)
            } else {
              contextMenuOps[op]()
            }
    });
  }
  $(document).contextmenu(function(e){
    console.log(e.target)
    let target = $(e.target)
    let x = e.pageX
    let y = e.pageY
    let s = {top: y+'px', left: x+'px'}
    curContextMenuItem = target
    if (target.hasClass('contextMenu_sideButton')) {
      contextMenu_side.hide()
      $('.contextMenu_side').css(s)
      contextMenu_side.show()
    } else if (target.hasClass('contextMenu_sideItemButton')) {
      contextMenu_sideItem.hide()
      $('.contextMenu_sideItem').css(s)
      contextMenu_sideItem.show()
    } else if (target.hasClass('contextMenu_imageButton')) {
      contextMenu_image.hide()
      $('.contextMenu_image').css(s)
      contextMenu_image.show()
    }
  })

  // Textfields
  let tfs = document.querySelectorAll('.mdc-textfield');
  for (let tf of tfs) {
    mdc.textfield.MDCTextfield.attachTo(tf);
  }

  // Dialogs
  dialog_side_new = new mdc.dialog.MDCDialog(document.querySelector('#dialog_side_new'));
  $('#dialog_side_new .accept').click(function(){
    let value = $('#dialog_side_new input').val()
    addCat(value)
    $('#dialog_side_new input').val('')
    dialog_side_new.close()
  })

  // IPC
  ipc.on('import_folders-back', function (event, dirs) {
    let all = []
    for (let i = 0; i < dirs.length; i++) {
      let images = fs.readdirSync(dirs[i]).filter(isImage)
      for (let j = 0; j < images.length; j++) {
        all.push(path.join(dirs[i],images[j]))
      }
    }
    importImages(all)
  })
  ipc.on('import_images-back', function (event, files) {
    importImages(files)
  })

  // Routers
  window.addEventListener("hashchange", () => {
    let h = window.location.hash.slice(1)
    console.log(h)
    clearImages()
    showImages(library.get(h))
  });

  showImages(library.get('all'))
}

// UI functions
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

function showSnackbar(text){
  let data =  {
            message: text,
            actionOnBottom: false,
            multiline: false
          };
  snackbar.show(data)
}

function showImages(urls){
  for (let i = 0; i < urls.length; i++) {
    showImage(urls[i])
  }
}
function showImage(url){
  let image = '<li class="mdc-grid-tile" style="width: '+ managerConfig.get('imageSize') +'">' +
            '<div class="mdc-grid-tile__primary">' +
               '<div src="'+url+'" style="background-image: url('+ url +');" class="mdc-grid-tile__primary-content contextMenu_imageButton" /></div>' +
               '</div></li>'
  $('#images').append(image)
}

function clearImages(){
  $('#images').empty()
}




// Data functions
function importImages(urls){
  urls = urls.map((item) => decodeURIComponent(item))
  let lib = library.get('all')
  let tmp = merge(lib, urls)
  library.set('all', tmp.new)
  if (window.location.hash==='#all') {showImages(tmp.newAdded)}
  let lenAdded = tmp.newAdded.length
  let lenDup = urls.length - lenAdded
  let message = ''
  if (lenAdded == 1) {
    message += '1 image imported.'
  } else {
    message += lenAdded + ' images imported.'
  }
  if (lenDup == 1) {
    message += ' (' + lenDup + ' image already here.)'
  } else if (lenDup > 1) {
    message += ' (' + lenDup + ' images already here.)'
  }
  showSnackbar(message)
}
function removeAllImages(){
  for (let key in library.store) {
    library.set(key,[])
  }
  clearImages()
  showSnackbar('All images removed. (from library)')
}
function removeImage(url){
  for (let key in library.store) {
    let tmp = library.get(key)
    tmp.splice(tmp.indexOf(url), 1)
    library.set(key, tmp)
  }
  showSnackbar('1 image removed.')
}
function addCat(v){
  let newCat = $('<a class="mdc-list-item contextMenu_sideItemButton" href="#'+v.trim().toLowerCase()+'">'+
               '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true">photo_library</i>'+
               '<p data-cat="'+v.trim().toLowerCase()+'">'+v+'</p>' +
               '</a>')
  newCat.click(function(){
    $('#side .mdc-list-item').removeClass('mdc-permanent-drawer--selected')
    $(this).addClass('mdc-permanent-drawer--selected')
  })
  $('#side_items').append(newCat)
  library.set(v.trim().toLowerCase(),[])
  let newContextCat = $('<li class="mdc-list-item" role="menuitem" tabindex="0" data-cat="'+v+'"name="move_to">Move To '+v+'</li>')
  $('#image_context_menu').append(newContextCat)
}





// Helper functions
function isEmptyObj(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}
function isImage(file){
  let imgExts = ['png','jpg','jpeg','png']
  let ext = file.slice(file.lastIndexOf('.')+1).toLowerCase()
  return imgExts.includes(ext)
}
function merge(oriArr, newElements) {
  let tmp = new Map()
  let result = {}
  result.ori = oriArr
  result.newAdded = []
  result.new = oriArr
  for (let i = 0; i < oriArr.length; i++) {
    tmp.set(oriArr[i], 1)
  }
  for (let i = 0; i < newElements.length; i++) {
    if (!tmp.get(newElements[i])) {
      result.newAdded.push(newElements[i])
      result.new.push(newElements[i])
    }
  }
  return result
}
