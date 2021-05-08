import React, { Component } from 'react';
import Navbar from "../Navbar/Navbar"
import Sidebar from "../Sidebar/Sidebar"
import Donation from "./Donation/Donation"
import SupplyCard from "./Supply/Supply"
import AddPost from "./Add Post/AddPost"
import "./Dashboard.css"

import DeFeed from "../../contracts/DeFeed.json"
import Web3 from 'web3';
import Supply from "../../contracts/Supply.json"


const IPFS = require('ipfs-api');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state= {
            Board: "donate",
            account: '',
            defeed:null,
            images:[]
        }
    }


    async componentWillMount(){
        await this.loadWeb3();
        await this.loadBlockchainData();
      }
      async loadWeb3() {
        if (window.ethereum) {
          window.web3 = new Web3(window.ethereum)
          await window.ethereum.enable()
        }
        else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider)
        }
        else {
          window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
      }
      async loadBlockchainData(){
        const web3=window.web3
    
        const accounts=await web3.eth.getAccounts()
        this.setState({account:accounts[0]})
        const networkID= await web3.eth.net.getId()
        const networkData=DeFeed.networks[networkID]
        if(networkData){
            //defeed contract
          const defeed=new web3.eth.Contract(DeFeed.abi,networkData.address);
          this.setState({defeed:defeed})
          const postsCount= await defeed.methods.postCount().call()
          this.setState({postsCount})
          for (var i = 1; i <= postsCount; i++) {
            const image = await defeed.methods.posts(i).call()
            this.setState({
              images: [...this.state.images, image]
            })
          }
          console.log(this.state.images)

          //supply contract
        //   const supply=new web3.eth.Contract(Supply.abi,networkData.address);
        //   this.setState({supply:supply})
        //   const productsCount= await supply.methods.productCount().call()
        //   this.setState({productsCount})
        //   console.log(productsCount)
        //   for (var i = 1; i <= productsCount; i++) {
        //     const product = await supply.methods.products(i).call()
        //     this.setState({
        //       products: [...this.state.products, product]
        //     })
        //   }
        //   console.log(this.state.products)


        } else{
          window.alert("defeed contract not deployed")
        }
      }
    
      captureFile = event => { //pre processing file
    
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
    
        reader.onloadend = () => {
          this.setState({ buffer: Buffer(reader.result) })
          console.log('buffer', this.state.buffer)
        }
      }
    
    
      uploadImage = description => {
        console.log("Submitting file to ipfs...")
        //adding file to the IPFS
        ipfs.files.add(this.state.buffer, (error, result) => {
            console.log(result[0].hash)
          if(error) {
            console.error(error)
            return
          }
          this.state.defeed.methods.uploadPost(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
          })
        })
      }
    
    tipImageOwner=(id, tipAmount)=> {
        this.state.defeed.methods.donatePostAuthor(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
        })
    }
    clickActive=(s)=>{
        this.setState({Board: s})
    }

    render() {

        let activeBoard;
        if(this.state.Board === "donate") {
            activeBoard= <Donation  images={this.state.images} tipImageOwner={this.tipImageOwner}/>
        }
        if(this.state.Board === "supply") {
            activeBoard= <SupplyCard account={this.state.account} loadWeb3={this.loadWeb3} captureFile={this.captureFile} />
        }
        if(this.state.Board === "add post") {
            activeBoard= <AddPost captureFile={this.captureFile} uploadImage={this.uploadImage} />
        }

        return (
            <div className="Dashboard">
                <div className="barNav">
                    <Navbar account={this.props.account}/>
                </div>
                <div className="dashWrap">
                    <div className="sideBar">
                        <Sidebar Board={this.state.Board} clickActive={this.clickActive} />
                    </div>
                    <img className="vert" src={process.env.PUBLIC_URL + './Images/Verticle.svg'} />
                    <div className="Board">
                        {activeBoard}
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;