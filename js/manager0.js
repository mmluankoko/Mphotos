// const electron = require('electron')
// const ipc = electron.ipcRenderer
// const remote = electron.remote
// const fs = require('fs')
// const path = require('path')
// const storage = require('electron-json-storage')
// const Config = require('electron-config')
// const open = require('opn');
// const managerConfig = new Config({name:'managerConfig'})
// const library = new Config({name:'library'})
// const mdc = require('../node_modules/material-components-web/dist/material-components-web.js')
// let snackbar, curContextMenuItem, dialog_side_new

// // Menu operations
// let menuOps = {}
// menuOps.import_images = () => {
//   console.log('menuOps.import_images')
//   ipc.send('import_images')
// }
// menuOps.import_folders = () => {
//   console.log('menuOps.import_folders')
//   ipc.send('import_folders')
// }
// menuOps.remove_all_images = () => {
//   console.log('menuOps.remove_all_images')
//   removeAllImages()
// }
// menuOps.quit = () => {
//   console.log('menuOps.quit')
//   ipc.send('quit', '')
// }
// menuOps.close = () => {
//   console.log('menuOps.close')
//   remote.getCurrentWindow().close()
// }
//
// let contextMenuOps = {}
// contextMenuOps.side_new = () => {
//   console.log('contextMenuOps.side_new')
//   $('#dialog_side_new input').parent().removeClass('mdc-textfield--invalid')
//   $('#dialog_side_new input').val('')
//   dialog_side_new.show()
// }
// contextMenuOps.image_open = () => {
//   console.log('contextMenuOps.image_open')
//   open(curContextMenuItem.attr('src'))
// }
// contextMenuOps.image_open_folder = () => {
//   console.log('contextMenuOps.image_open_folder')
//   open(path.dirname(curContextMenuItem.attr('src')))
// }
// contextMenuOps.image_remove_from_lib = () => {
//   console.log('contextMenuOps.image_remove_from_lib')
//   removeImage(curContextMenuItem.attr('src'))
//   curContextMenuItem.parent().parent().remove()
// }
// contextMenuOps.image_remove_from_disk = () => {
//   console.log('contextMenuOps.image_remove_from_disk')
//   // (curContextMenuItem.attr('src'))
// }

// IPC handlers
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

// // Initialization
// $(document).ready(() => init())
// function init(){
//   // read or initialize config
//   if (!managerConfig.has('imageSize')) {
//     managerConfig.set('imageSize','100px')
//   }
//   if (!library.has('all')) {
//     library.set('all',[])
//   } else {
//     addImages(library.get('all'))
//   }
//   console.log(library.get('all'))
//   // UI initialization
//   $('#side .mdc-list-item').click(function(){
//     $('#side .mdc-list-item').removeClass('mdc-permanent-drawer--selected')
//     $(this).addClass('mdc-permanent-drawer--selected')
//   })
//   $('.mdc-grid-tile').css('width',managerConfig.get('imageSize'))
//   $('#zoom_in').click(() => zoom('in'))
//   $('#zoom_out').click(() => zoom('out'))
//
//   for (let key in library.store) {
//     if(key === 'all') continue
//     let cat = $('<a class="mdc-list-item contextMenu_sideItemButton" href="#">'+
//                  '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true">photo_library</i>'+
//                  '<p data-cat="'+key+'">'+key+'</p>' +
//                  '</a>')
//     cat.click(function(){
//       $('#side .mdc-list-item').removeClass('mdc-permanent-drawer--selected')
//       $(this).addClass('mdc-permanent-drawer--selected')
//     })
//     $('#side_items').append(cat)
//   }
//
//
//   // Snackbar
//   snackbar = new mdc.snackbar.MDCSnackbar(document.getElementById('snackbar'));
//
//   // Menu
//   let menu = new mdc.menu.MDCSimpleMenu(document.querySelector('.menu'))
//   $('.menuButton').click(() => menu.open = !menu.open);
//   document.querySelector('.menu').addEventListener('MDCSimpleMenu:selected', function(evt) {
//           let detail = evt.detail
//           let op = $(detail.item).attr('name')
//           console.log(detail.item.textContent.trim())
//           menuOps[op]()
//   });
//
//   // Context menus
//   let contextMenu_side = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_side'))
//   let contextMenu_sideItem = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_sideItem'))
//   let contextMenu_image = new mdc.menu.MDCSimpleMenu(document.querySelector('.contextMenu_image'))
//   for (let m of document.querySelectorAll('.contextMenu')) {
//     m.addEventListener('MDCSimpleMenu:selected', function(evt) {
//             let detail = evt.detail
//             let op = $(detail.item).attr('name')
//             console.log(detail.item.textContent.trim())
//             contextMenuOps[op]()
//     });
//   }
//
//   $(document).contextmenu(function(e){
//     console.log(e.target)
//     let target = $(e.target)
//     let x = e.pageX
//     let y = e.pageY
//     let s = {top: y+'px', left: x+'px'}
//     curContextMenuItem = target
//     if (target.hasClass('contextMenu_sideButton')) {
//       contextMenu_side.hide()
//       $('.contextMenu_side').css(s)
//       contextMenu_side.show()
//     } else if (target.hasClass('contextMenu_sideItemButton')) {
//       contextMenu_sideItem.hide()
//       $('.contextMenu_sideItem').css(s)
//       contextMenu_sideItem.show()
//     } else if (target.hasClass('contextMenu_imageButton')) {
//       contextMenu_image.hide()
//       $('.contextMenu_image').css(s)
//       contextMenu_image.show()
//     }
//   })
//
//   // Textfields
//   let tfs = document.querySelectorAll('.mdc-textfield');
//   for (let tf of tfs) {
//     mdc.textfield.MDCTextfield.attachTo(tf);
//   }
//
//   // Dialogs
//   dialog_side_new = new mdc.dialog.MDCDialog(document.querySelector('#dialog_side_new'));
//   $('#dialog_side_new .accept').click(function(){
//     let value = $('#dialog_side_new input').val()
//     let newCat = $('<a class="mdc-list-item contextMenu_sideItemButton" href="#">'+
//                  '<i class="material-icons mdc-list-item__start-detail" aria-hidden="true">photo_library</i>'+
//                  '<p data-cat="'+value.trim().toLowerCase()+'">'+value+'</p>' +
//                  '</a>')
//     newCat.click(function(){
//       $('#side .mdc-list-item').removeClass('mdc-permanent-drawer--selected')
//       $(this).addClass('mdc-permanent-drawer--selected')
//     })
//     $('#side_items').append(newCat)
//     library.set(value.trim().toLowerCase(),[])
//     $('#dialog_side_new input').val('')
//     dialog_side_new.close()
//   })
//
//
//   console.log(library.path)
// }

// // UI functions
// function zoom(op){
//   let sz = parseInt(managerConfig.get('imageSize').replace('px',''))
//   if (op==='in') {
//     sz += 20
//     if (sz > 300) sz = 300
//   }
//   if (op==='out') {
//     sz -= 20
//     if (sz < 100) sz = 100
//   }
//   sz += 'px'
//   $('.mdc-grid-tile').css('width',sz)
//   managerConfig.set('imageSize',sz)
// }
//
// function showSnackbar(text){
//   let data =  {
//             message: text,
//             actionOnBottom: false,
//             multiline: false
//           };
//   snackbar.show(data)
// }
//
// function addImages(urls){
//   for (let i = 0; i < urls.length; i++) {
//     addImage(urls[i])
//   }
// }
// function addImage(url){
//   let image = '<li class="mdc-grid-tile" style="width: '+ managerConfig.get('imageSize') +'">' +
//             '<div class="mdc-grid-tile__primary">' +
//                '<div src="'+url+'" style="background-image: url('+ url +');" class="mdc-grid-tile__primary-content contextMenu_imageButton" /></div>' +
//                '</div></li>'
//   $('#images').append(image)
// }
//
// function clearAllImages(){
//   $('#images').empty()
// }

// // Data functions
// function importImages(urls){
//   let lib = library.get('all')
//   let tmp = merge(lib, urls)
//   library.set('all', tmp.new)
//   addImages(tmp.newAdded)
//   let lenAdded = tmp.newAdded.length
//   let lenDup = urls.length - lenAdded
//   let message = ''
//   if (lenAdded == 1) {
//     message += '1 image imported.'
//   } else {
//     message += lenAdded + ' images imported.'
//   }
//   if (lenDup == 1) {
//     message += ' (' + lenDup + ' image already here.)'
//   } else if (lenDup > 1) {
//     message += ' (' + lenDup + ' images already here.)'
//   }
//   showSnackbar(message)
// }
// function removeAllImages(){
//   library.set('all', [])
//   clearAllImages()
// }
// function removeImage(url){
//   let tmp = library.get('all')
//   tmp.splice(tmp.indexOf(url), 1)
//   library.set('all', tmp)
//   showSnackbar('1 image removed.')
// }


// // Helper functions
// function isEmptyObj(obj) {
//   return Object.keys(obj).length === 0 && obj.constructor === Object
// }
// function isImage(file){
//   let imgExts = ['png','jpg','jpeg','png']
//   let ext = file.slice(file.lastIndexOf('.')+1).toLowerCase()
//   return imgExts.includes(ext)
// }
// function merge(oriArr, newElements) {
//   let tmp = new Map()
//   let result = {}
//   result.ori = oriArr
//   result.newAdded = []
//   result.new = oriArr
//   for (let i = 0; i < oriArr.length; i++) {
//     tmp.set(oriArr[i], 1)
//   }
//   for (let i = 0; i < newElements.length; i++) {
//     if (!tmp.get(newElements[i])) {
//       result.newAdded.push(newElements[i])
//       result.new.push(newElements[i])
//     }
//   }
//   return result
// }
