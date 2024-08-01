import { invoke } from '@tauri-apps/api';
import { Component } from 'react'


export class ServiceBox extends Component<IServiceProps, { unlink: boolean }> {
  
  state = { unlink: false }

  constructor(props: IServiceProps) {
    super(props); 
  }

  handleClose() {
    this.setState({ unlink: true });
    invoke('client_delete', { name: this.props.name });
  }

  render() {
    return (
      <div className="row" style={{ paddingInline: '5px', marginBottom: '10px' }}>
        <div className="box icon bg-success" style={{ width: '100px' }}>
          <i className="material-icons" style={{ fontSize: '30px', color: 'white' }}>desktop_windows</i>
          <span className="timer">{this.props.time}</span>
        </div>
        <div className="box detail bg-dark" style={{ width: '200px' }}>
          <div className="row" style={{ paddingInline: '10px' }}>
            <span className="label">Name:</span>
            <span className="text">{this.props.name}</span>
          </div>
          <div className="row" style={{ paddingInline: '10px' }}>
            <span className="label">IP Address:</span>
            <span className="text">{this.props.ip}</span>
          </div>
          <div className="row" style={{ paddingInline: '10px' }}>
            <span className="label">TTL:</span>
            <span className="text">{this.props.ttl}</span>
          </div>
        </div>
        <button className='close_button' disabled={this.state.unlink} onClick={this.handleClose.bind(this)}>x</button>
      </div>
    )
  }
}

export default ServiceBox