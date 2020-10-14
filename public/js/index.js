//This file is to get data from UI and then delegate the action
import '@babel/polyfill'; // just required to polyfill some JS 
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

//DOM ELEMENTS
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const logOutBtn = document.querySelector('.nav__el--logout');//got from '_header.pug'
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')

//DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations)
    displayMap(locations)
}

if (loginForm)
    loginForm.addEventListener('submit', e => {
        //submit is the object that browser throws when user submits the login form
        e.preventDefault();//Prevents the form from loading any other page
        const email = document.getElementById('email').value; //Ids as mentioned in login.pub
        const password = document.getElementById('password').value; //Ids as mentioned in login.pub
        login(email, password)
    })

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout)
}

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        updateSettings({ name, email }, 'data')
    })
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...'
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password')

        document.querySelector('.btn--save-password').textContent = 'Save password'
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    })
}

