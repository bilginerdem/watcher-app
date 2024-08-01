import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import ServiceBox from "./components/ServiceBox";
import { listen } from "@tauri-apps/api/event";

function App() {
  const [servers, setServers] = useState<IServiceProps[]>([]);
  const [show, setShow] = useState(false);
  const [service, setService] = useState({ name: '', ipaddres: '' })

  const handleInputChange = (e: any) => {
    setService({
      ...service,
      [e.target.name]: e.target.value
    }); 
  }

  const handleAddClient = () => { 
    setService({ name: '', ipaddres: '' });
    setShow(false);

    invoke('client_register', { name: service.name, ip: service.ipaddres }); 
  }

  const handlePopup = () => {
    setShow(!show);
  }

  const updateServer = (server: IServiceProps) => {
    const udpateServers = servers.map((c) => {
      if (c.name === server.name) {
        return server;
      } else {
        return c;
      }
    });
    setServers(udpateServers);
  }

  useEffect(() => {
    const unInfoSub = listen<IServiceProps>('info', (event) => {
      updateServer(event.payload);
    })
    const unAddSub = listen<IServiceProps>('create', (event) => {
      setServers([...servers, event.payload]);
    });
    const unDeleted = listen<IServiceProps>('deleted', (event) => {
      setServers(servers.filter(x => x.name != event.payload.name));
    })


    return () => {
      unInfoSub.then(f => f());
      unAddSub.then(f => f());
      unDeleted.then(f => f());
    };
  }, [servers]);



  return (
    <div className="container">
      {servers.map(x => <ServiceBox key={x.name} name={x.name} ip={x.ip} time={x.time} ttl={x.ttl} />)}

      <div className="popup">
        <span className={"popuptext " + (show ? "show" : "")}>
          <div className="column">
            <input type="text" name="name" value={service.name} onBlur={handleInputChange} onChange={handleInputChange} placeholder="Name" />
            <input type="text" name="ipaddres" value={service.ipaddres} onBlur={handleInputChange} onChange={handleInputChange} pattern="^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{1,2}):([0-9]{1,5})$" placeholder="IP Address (0.0.0.0:80)" />
            <button className="save bg-success" onClick={handleAddClient} >Save</button>
          </div>
        </span>
        <button className="add" onClick={handlePopup} >
          {show ? 'x' : '+'}
        </button>
      </div>
    </div>
  );
}

export default App;
