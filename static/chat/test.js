
let posts = document.querySelector('#posts')
let chat_test_long = JSON.parse(document.querySelector('#chat_test_long').textContent)
let chat_test_sse = JSON.parse(document.querySelector('#chat_test_sse').textContent)
let csrf = document.querySelector('input[name=csrfmiddlewaretoken]').value
let send = document.querySelector('#send')


function make_requset(method, url, headers, data, re) {
    $.ajax({
        url:url,
        method:method,
        headers:headers,
        data:data,
        success: (data, status, jq) => {
             let datas = data.data
             if (datas){
                 for (let element of  datas) {
                     
                     console.log($(posts).length)
                     $(posts).append('<p>'+ element +'</p>')    
                 }
             }
        },error: (error, status, jq) => {
            console.error(error)
        }

    })
    if (re){
       setTimeout(()=>{
           make_requset(method, url, headers, data, re) 
       }, 10000) 
    }
}


$(send).click(()=>{
    make_requset('POST',url, {'X-CSRFToken': csrf},{'element': 'new element'})
});


url = chat_test_long

window.addEventListener('load', ()=>{
    make_requset('GET',url,{},{},true)
    make_requset('POST',url, {'X-CSRFToken': csrf},{'element': 'new element',})
})