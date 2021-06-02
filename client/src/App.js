import React, { useState } from 'react';
import _ from 'lodash';
// import logo from './logo.svg';
import './App.css';
import { io } from 'socket.io-client';
// import ss from 'socket.io-stream';
import axios from 'axios';

const HOST = `/`;

function makeid(length) {
  var result = [];
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength)),
    );
  }
  return result.join('');
}

function App() {
  const [isConnect, setIsConnect] = React.useState(false);

  const [room, setRoom] = React.useState('');
  const [q, setQ] = React.useState('');

  const [reason, setReason] = React.useState('');
  const [lastEvent, setLastEvent] = React.useState('');

  const socket = React.useRef(null);
  const [selectedFile, setSelectedFile] = React.useState();
  // const [isSelected, setIsSelected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [input, setInput] = React.useState('');
  const [replyID, setReplyID] = React.useState('');
  const [deleteID, setDeleteID] = React.useState('');

  const [name, setName] = React.useState('');
  const [tel, setTel] = React.useState('');
  const [subject, setSubject] = React.useState('');

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    // setIsSelected(true);
  };

  const handleSubmission = async () => {
    const data = {
      message: input,
      client_message_id: makeid(8),
    };
    if (replyID) _.set(data, ['reply'], replyID);

    if (selectedFile) {
      // console.log({ selectedFile });

      const fd = new FormData();

      _.forEach(data, (v, k) => {
        fd.append(k, v);
      });

      fd.append('file', selectedFile);

      // setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      await axios({
        url: `${HOST}/api/v1/message/file`,
        method: 'post',
        headers: {
          // authorization: `Bearer ${token}`,
          socketid: socket.current.id,
        },
        data: fd,
      })
        .catch((e) => {
          console.log({ e });
        })
        .finally(() => {
          // setIsLoading(false);
        });
    } else if (input) {
      socket.current.emit('message', data, (err) => {
        console.log({ err });
      });
    }
  };

  const connectSocket = (api_key) => {
    socket.current = io(HOST, {
      // auth: {
      //   api_key: api_key,
      // },
      query: {
        name,
        phone: tel,
        subject,
      },
      transports: ['websocket'],
      transportOptions: {},
    });

    socket.current.on('connected', (data) => {
      setLastEvent('connected');
      setMessage(data.message);
      setQ(data.QueueID);
      socket.current.on('new_message', (data) => {
        console.log({ new_message: data });
        setLastEvent('new_message');
        setMessage(data.data.message);
      });

      socket.current.on('delete_message', (data) => {
        console.log({ delete_message: data });
        setLastEvent('delete_message');
        setMessage(_.get(data.data, ['id']));
      });

      socket.current.on('list_message', (data) => {
        console.log({ list_message: data });
        setLastEvent('list_message');
        setMessage(data.data.length);
      });

      socket.current.on('join_room', (data) => {
        console.log({ join_room: data });
        setLastEvent('join_room');
        setMessage(data.room_id);
        setRoom(data.room_id);
      });

      socket.current.on('leave_chat', (data) => {
        console.log({ leave_chat: data });
        setLastEvent('leave_chat');
        setMessage(_.get(data.data, ['name'], _.get(data.data, ['name'])));
      });

      socket.current.on('disconnect', (reason) => {
        setReason(reason);
        setIsConnect(false);
        setRoom('');
        setQ('');
      });
      socket.current.on('error', (reason) => {
        console.log({ reason });
      });

      setReason('');
      setIsConnect(true);
    });
  };

  React.useEffect(() => {
    // const urlParams = new URLSearchParams(window.location.search);
    // const api_key = urlParams.get('api_key');
    // connectSocket(api_key);
  }, []);

  React.useEffect(() => {
    if (isConnect) {
      console.log({ socket });
    }
  }, [isConnect]);

  return (
    <div className='App'>
      <header className='App-header'>
        <p>{`${
          isConnect
            ? `Connected (id : ${_.get(socket, ['current', 'id'])})`
            : `Socket Not Connect / Reason : ${reason}`
        }`}</p>
        <p>{`${q && `Queue ID (${q})`}`}</p>
        <p>{`Room ${room ? `"${room}" has joined` : 'not join'}`}</p>
        {isConnect ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <br />
            <div>
              <p>
                {'Text:  '}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </p>
              <p>
                {'ReplyID:  '}
                <input
                  value={replyID}
                  onChange={(e) => setReplyID(e.target.value)}
                />
              </p>
            </div>
            <br />
            {/*<div>
              <input
                label=''
                type='file'
                name='file'
                onChange={changeHandler}
              />
            </div>
<br />*/}
            <div>
              <button disabled={isLoading} onClick={handleSubmission}>
                {isLoading ? 'Sending' : 'Submit'}
              </button>
              <button
                disabled={isLoading}
                onClick={() => {
                  socket.current.close();
                }}
              >
                close
              </button>
            </div>
            {/*<div>
              <p>
                {'DeleteID:  '}
                <input
                  value={deleteID}
                  onChange={(e) => setDeleteID(e.target.value)}
                />
                <button
                  onClick={() => {
                    socket.current.emit(
                      'delete_message',
                      {
                        id: deleteID,
                      },
                      (err) => {
                        console.log({ err });
                      },
                    );
                  }}
                >
                  Delete
                </button>
              </p>
                </div>*/}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <br />
            <div>
              <p>
                {'ชื่อ - นามสกุล:  '}
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </p>
              <p>
                {'โทรศัพท์:  '}
                <input value={tel} onChange={(e) => setTel(e.target.value)} />
              </p>
              <p>
                {'หัวข้อ:  '}
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value='หัวข้อ1'>หัวข้อ1</option>
                  <option value='หัวข้อ2'>หัวข้อ2</option>
                  <option value='หัวข้อ3'>หัวข้อ3</option>
                </select>
              </p>
            </div>
            <div>
              <button
                disabled={isLoading}
                onClick={() => {
                  connectSocket();
                }}
              >
                Connect
              </button>
            </div>
          </div>
        )}
        {isConnect && <p>{`${lastEvent} : ${message}`}</p>}
      </header>
    </div>
  );
}

export default App;
