
function start_sse_js(){
    let form = document.querySelector('#chat-form')
    let btn = document.querySelector('#send-btn')
    let long_url = JSON.parse(document.querySelector('#long_url').textContent)
    let store_url = JSON.parse(document.querySelector('#store_url').textContent)
    let user = JSON.parse(document.querySelector('#user').textContent)
    let name_room = JSON.parse(document.querySelector('#room').textContent)
    let new_room = JSON.parse(document.querySelector('#new_room').textContent)
    let sse_url = JSON.parse(document.querySelector('#chat_sse').textContent)
    let message = document.querySelector('#message')
    let csrftoken = $(document.querySelector("[name=csrfmiddlewaretoken]")).first().val()
    let messages_holder = $('#messages').get()
    const REQUEST_TIMEOUT_SECS = 15;
    const REQUEST_TIMEOUT_MICRO_SECS = REQUEST_TIMEOUT_SECS * 1000;

    function send_message(){
        $(btn).click(event => {
            event.preventDefault()
            message_val = $(message).val().trim()
            $(message).val(' ')
            let post_message_data = {'message': message_val}
            let headers = {'X-CSRFToken': csrftoken}
            let response = $.ajax({
                url:store_url,
                method: 'post',
                async:true,
                headers:headers,
                data: post_message_data,
                success: (data, status, jqxml)=> {

                },
                error: (error, statusText, jqxml)=>{
                    console.log(error)
                    console.log(statusText)
                }
            })
        })    
    
    }

    function is_current_user(user_name) {
        return user_name == user
    }

    function append(message) {
        console.log(message)    

        let message_body = document.createElement('p')
        $(message_body).text(message['body'])
        
        let created_at = document.createElement('span')
        $(created_at).text(message['natural_createdat'])
        $(created_at).addClass('time_date')

        let message_holder = document.createElement('div')
        $(message_holder).append(message_body, created_at)

        let message_warper = document.createElement('div')
        $(message_warper).append(message_holder)

        if (is_current_user(message['sender'])) {
            $(message_holder).addClass('sent_msg')
            $(message_warper).addClass('outgoing_msg')
            $(messages).append(message_warper)
            
        }else{
            let addtinal_message_warper = document.createElement('div')
            let parnter_image_warper = document.createElement('div')
           
            let parnter_image = document.createElement('img')
            
            $(parnter_image).attr('src', 'https://ptetutorials.com/images/user-profile.png')

            $(parnter_image_warper).addClass('incoming_msg_img')
            
            $(addtinal_message_warper).addClass('incoming_msg')
            $(message_holder).addClass('received_withd_msg')
            $(message_warper).addClass('received_msg')
            
            $(parnter_image_warper).append(parnter_image)
            
            $(addtinal_message_warper).prepend(parnter_image_warper)
            
            $(addtinal_message_warper).append(message_warper)
            
            $(messages).append(addtinal_message_warper)

        }
        
    }
    
    function ajax_make_request(url) {
        $.ajax({
            url:url,
            success: (data, status, jq) => {
                console.log(data)
                let messages = data['messages']
                if(messages){
                    for (let message of messages) {
                        append(message)
                    }
                }
            },
            error: (error, status_text, jqxml)=>{
                console.log(error)
                console.log(status_text)
            }
        })
    }

    let sse_client = new EventSource(sse_url, {withCredentials: true})

    sse_client.onmessage = (message_event) => {
        let data =  message_event.data
        console.log(data)
        if (data) {
            for (let message of JSON.parse(message_event.data)['messages']){
                append(message)
            }
        }
    }

    function get_all_messages(url){
        ajax_make_request(url)
    }

    send_message()
    get_all_messages(store_url)
} 

window.addEventListener('load', start_sse_js)