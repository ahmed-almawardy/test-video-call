
function start_js(){
    let form = document.querySelector('#chat-form')
    let btn = document.querySelector('#send-btn')
    let long_url = JSON.parse(document.querySelector('#long_url').textContent)
    let store_url = JSON.parse(document.querySelector('#store_url').textContent)
    let user = JSON.parse(document.querySelector('#user').textContent)
    let name_room = JSON.parse(document.querySelector('#room').textContent)
    let new_room = JSON.parse(document.querySelector('#new_room').textContent)
    let message = document.querySelector('#message')
    let csrftoken = $(document.querySelector("[name=csrfmiddlewaretoken]")).first().val()
    let messages_holder = $('#messages').get()
    const TIME_WAIT_SECS = 2;
    const TIME_WAIT_MICRO_SECS = 5 * 1000 ;

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


    function append(message) {
        let row = $(document.createElement('div'))
        row.addClass('row')
        let sender = $(document.createElement('div'))
        sender.text(message['sender'])
        sender.addClass('col-2 ')
        
        let message_div = $(document.createElement('div'))
        message_div.text(message['body'])
        message_div.addClass('col-8')

        let at = $(document.createElement('div'))
        at.text(message['natural_createdat'])
        at.addClass('col-2 ')
        
        row.append(sender, message_div, at)
        $(messages_holder).append(row)
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

    function make_json_request(url){
        let request = new XMLHttpRequest()
        request.open('get', url)
        request.responseType = 'json'
        request.addEventListener('load', function() {
            let response = request.response
            if (response['messages']){
                let messages = response['messages']
                console.log(messages)
                for (let message of messages) {
                    append(message)
                }
            }
        });

        request.addEventListener('abort', function(){
            console.log('abort')
        });

        request.addEventListener('error', function(){
            console.log('error')
            setTimeout(()=>{make_json_request(url)}, TIME_WAIT_MICRO_SECS);
        });

        request.send()        
    }

    function get_all_messages(url){
        ajax_make_request(url)
    }

    function longpolling(url) {
        ajax_make_request(url)
        setTimeout(()=>{longpolling(url)}, TIME_WAIT_MICRO_SECS);
    }

    send_message()
    get_all_messages(store_url)
    longpolling(long_url)

} 

window.addEventListener('load', start_js)