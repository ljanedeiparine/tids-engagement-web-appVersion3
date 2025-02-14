import React, { useState, useEffect } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import { useAppDispatch, useAppSelector } from '../redux/store'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Nav from 'react-bootstrap/Nav'
import { addTask, AddTaskState } from '../redux/addTaskSlice'
import { fetchIncompleteTasks } from '../redux/incompleteTasksSlice'

interface EventModalProps {
  show: boolean
  onHide: () => void
  addedTasks: (orders: AddTaskState) => void
  email: any
}

const AddTaskModal: React.FC<EventModalProps> = ({ show, onHide, addedTasks, email }) => {
  const modalStyle = {
    border: 'none', // Add a new border style
    margin: '4%',
    marginBottom: '0',
  }

  const ModalButton = {
    marginRight: '5px',
    borderColor: '#2B8000',
    backgroundColor: '#2B8000',
    width: '125px',
    fontSize: '11px',
    fontFamily: 'Mulish',
  }

  const ModalTitleDiv = {
    display: 'inline-flex',
  }

  const ModalStatus = {
    marginTop: '6px',
    paddingLeft: '11px',
  }

  const datePickerStyles = {
    backgroundColor: '#DEDEDE',
    borderRadius: '25px',
  }

  const [titleError, setTitleError] = useState('')
  const [dueDateError, setDueDateError] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [importanceError, setImportanceError] = useState('')

  const dispatch = useAppDispatch()
  const [buttonClicked, setButtonClicked] = useState(false)

  const [time, setTime] = useState()
  let newTime

  const [formValues, setFormValues] = useState({
    title: '',
    dueDate: new Date(new Date().getTime() + 8 * 60 * 60 * 1000), // Adjust to UTC+8 for Manila
    details: '',
    link: '',
    importance: '',
    createdDate: new Date(),
    createdBy: localStorage.getItem('givenName') + ' ' + localStorage.getItem('familyName'),
  })

  const handleInputChange = async (event: any) => {
    let name: any, value: any

    if (event.target) {
      name = event.target.name
      value = event.target.value
    } else {
      name = 'time'
      await setTime(event)
      newTime = event
      value = convertTo12HourFormat(newTime)
    }
    if (name === 'dueDate') {
      // Create a Date object from the provided value
      const localDate = new Date(value)

      // Convert the local date (GMT+8) to UTC
      const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
      // const dateValue = new Date(value)

      setFormValues((prevFormValues) => ({
        ...prevFormValues,
        [name]: utcDate,
      }))
      setDueDateError('')
    } else {
      setFormValues((prevFormValues) => ({
        ...prevFormValues,
        [name]: value,
      }))
    }

    if (name === 'title') {
      setTitleError('')
    }

    if (name === 'details') {
      setDetailsError('')
    }

    if (name === 'importance') {
      setImportanceError('')
    }
  }

  const handleAddTask = () => {
    setTitleError('')
    setDueDateError('')
    setDetailsError('')
    setImportanceError('')

    let hasError = false

    if (formValues.title.trim() === '') {
      setTitleError('Title is required.')
      hasError = true
    }

    if (formValues.details.trim() === '') {
      setDetailsError('Details are required.')
      hasError = true
    }

    if (formValues.importance === '') {
      setImportanceError('Importance is required.')
      hasError = true
    }

    if (isNaN(formValues.dueDate.getTime())) {
      setDueDateError('Due date and time required.')
      hasError = true
    }

    // if (dueDate < currentDateTime) {
    //   setDueDateError('Due date and time must be in the future.')
    //   hasError = true
    // }

    if (formValues.dueDate)
      if (hasError) {
        return
      }

    setButtonClicked(true)
  }

  const handleModalHide = () => {
    handleClearFields()
    setTitleError('')
    setDueDateError('')
    setImportanceError('')
    setDetailsError('')
    onHide()
  }

  const handleClearFields = () => {
    setFormValues({
      title: '',
      dueDate: new Date(new Date().getTime() + 8 * 60 * 60 * 1000), // Placeholder date (January 1, 0000 at 00:00 UTC)
      details: '',
      link: '',
      importance: '',
      createdDate: new Date(),
      createdBy: localStorage.getItem('givenName') + ' ' + localStorage.getItem('familyName'),
    })
  }

  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) {
      date = new Date('0000-01-01T00:00:00Z') // Use current date and time as fallback
    }
    return date.toISOString().slice(0, 16) // Format to 'yyyy-MM-ddTHH:mm'
  }

  useEffect(() => {
    if (buttonClicked) {
      dispatch(addTask(formValues))
        .then(() => dispatch(fetchIncompleteTasks(email)))
        .then((resultAction) => {
          if (resultAction.type === fetchIncompleteTasks.fulfilled.type) {
            const newTasks = resultAction.payload as AddTaskState
            addedTasks(newTasks)
            setButtonClicked(false)
            setFormValues({
              title: '',
              dueDate: new Date(),
              details: '',
              link: '',
              importance: '',
              createdDate: new Date(),
              createdBy: localStorage.getItem('givenName') + ' ' + localStorage.getItem('familyName'),
            })
          }
        })
    }
  }, [buttonClicked])

  const getCurrentTime = () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).split('T')[0]
    if (formValues.dueDate.toISOString().split('T')[0] === today) {
      const now = new Date()
      const timezone = 'Asia/Manila'
      const timeOptions = {
        timeZone: timezone,
        hour12: true,
      }

      const formattedTime = now.toLocaleString('en-PH', timeOptions)
      const [date, time] = formattedTime.split(', ')

      return new Date(`${date} ${time}`)
    }

    const minTime = new Date()
    minTime.setHours(0)
    minTime.setMinutes(0)
    minTime.setSeconds(0)
    minTime.setMilliseconds(0)
    return minTime
  }

  const getMaxTime = () => {
    // You can set the maximum allowed time here. For example, if you want to allow times up to 23:59 (11:59 PM), use:
    const maxTime = new Date()
    maxTime.setHours(23)
    maxTime.setMinutes(59)
    maxTime.setSeconds(0)
    maxTime.setMilliseconds(0)
    return maxTime
  }

  const convertTo12HourFormat = (time: any) => {
    if (!(time instanceof Date) || isNaN(time.getTime())) {
      return '' // Handle the case when the time is not a valid Date object
    }

    const hours = time.getHours()
    const minutes = time.getMinutes()

    const amOrPm = hours >= 12 ? 'PM' : 'AM'
    const twelveHourFormatHours = hours % 12 || 12

    const formattedTime = `${twelveHourFormatHours}:${minutes.toString().padStart(2, '0')} ${amOrPm}`
    return formattedTime
  }

  const formattedTime = convertTo12HourFormat(time)
  // console.log('THIS')
  // console.log(formValues.dueDate.toISOString().slice(0, 16))

  return (
    <Modal
      show={show}
      onHide={handleModalHide}
      size='xl'
      aria-labelledby='contained-modal-title-vcenter'
      centered
    >
      <Modal.Header closeButton style={modalStyle}>
        <Modal.Title id='contained-modal-title-vcenter' className='mx-3' style={ModalTitleDiv}>
          Add Task
        </Modal.Title>
      </Modal.Header>
      <hr style={{ width: '87%', margin: '1rem auto', borderWidth: '2px', marginTop: '-5px' }} />
      <Modal.Body>
        <Container fluid className='px-5 pb-4'>
          <Row className='mb-3'>
            <Col>
              <Form.Group>
                <Form.Label>
                  Title<span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Control
                  required
                  type='text'
                  placeholder=''
                  name='title'
                  value={formValues.title}
                  onChange={handleInputChange}
                  style={{ backgroundColor: '#DEDEDE', borderRadius: '25px' }}
                  autoComplete='off'
                />
                {titleError && <div className='text-danger'>{titleError}</div>}
              </Form.Group>
            </Col>
            {
              <Col xs={4}>
                <Form.Group>
                  <Form.Label>
                    Due On<span style={{ color: 'red' }}>*</span>
                  </Form.Label>
                  <Form.Control
                    required
                    type='datetime-local'
                    placeholder=''
                    name='dueDate'
                    value={formatDate(formValues.dueDate)}
                    // value={
                    //   formValues.dueDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
                    //    .split('T')[0]
                    // }
                    onChange={handleInputChange}
                    style={{ backgroundColor: '#DEDEDE', borderRadius: '25px' }}
                    min={
                      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).split('T')[0]
                    }
                    // onKeyDown={(e) => e.preventDefault()}
                    autoComplete='off'
                  />
                  {dueDateError && <div className='text-danger'>{dueDateError}</div>}
                </Form.Group>
              </Col>
            }
            {/* <Col>
              <Form.Group>
                <Form.Label>
                  Due Date<span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <div style={{ width: '100%' }}>
                  <DatePicker
                    required
                    name='dueDate'
                    selected={formValues.dueDate}
                    onChange={(date) => handleInputChange({ target: { name: 'time', value: date } })}
                    showTimeSelect
                    dateFormat='MM/dd/yyyy h:mm aa'
                    timeFormat='h:mm aa'
                    minTime={getCurrentTime()}
                    maxTime={getMaxTime()}
                    className='custom-timepicker form-control'
                    autoComplete='off'
                    onKeyDown={(e) => e.preventDefault()}
                  />
                </div>
                {timeError && <div className='text-danger'>{timeError}</div>}
              </Form.Group>
            </Col> */}
          </Row>
          <Row className='my-4'>
            <Col xs={4}>
              <Form.Group>
                <Form.Label>
                  Details<span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Control
                  required
                  as='textarea'
                  placeholder=''
                  name='details'
                  value={formValues.details}
                  onChange={handleInputChange}
                  style={{ backgroundColor: '#DEDEDE', height: '116px', borderRadius: '25px' }}
                  autoComplete='off'
                />
                {detailsError && <div className='text-danger'>{detailsError}</div>}
              </Form.Group>
            </Col>
            <Col xs={4}>
              <Row className=''>
                <Form.Group>
                  <Form.Label>Link</Form.Label>
                  <div className='d-flex align-items-center'>
                    <Form.Control
                      required
                      type='text'
                      placeholder=''
                      name='link'
                      value={formValues.link}
                      onChange={handleInputChange}
                      style={{ backgroundColor: '#DEDEDE', borderRadius: '25px' }}
                      autoComplete='off'
                    />
                  </div>
                </Form.Group>
              </Row>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>
                  Importance<span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <div className='d-flex align-items-center'>
                  <Form.Select
                    aria-label='Default select example'
                    name='importance'
                    value={formValues.importance}
                    onChange={handleInputChange}
                    style={{ backgroundColor: '#DEDEDE', borderRadius: '25px' }}
                  >
                    <option value=''>Select importance</option>
                    <option value='Required'>Required</option>
                    <option value='Optional'>Optional</option>
                  </Form.Select>
                </div>
                {importanceError && <div className='text-danger'>{importanceError}</div>}
              </Form.Group>
            </Col>
          </Row>

          <Row className='justify-content-end' style={{ marginTop: '100px' }}>
            <Col xs={8} className='px-5' style={{ color: '#9FA2B4' }}></Col>
            <Col
              xs={2}
              className='text-center'
              style={{
                width: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2B8000',
              }}
            >
              <Nav.Link
                href=''
                className=''
                style={{ width: '-webkit-fill-available', fontSize: '14px' }}
                onClick={handleClearFields}
              >
                Clear Fields
              </Nav.Link>
            </Col>
            <Col
              xs={2}
              style={{ width: '130px', display: 'flex', alignItems: 'center', justifyContent: 'end' }}
            >
              <Button
                variant='success'
                onClick={handleAddTask}
                style={{
                  width: '-webkit-fill-available',
                  borderColor: '#2B8000',
                  backgroundColor: '#2B8000',
                  fontSize: '14px',
                }}
              >
                Create Task
              </Button>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
    </Modal>
  )
}

export default AddTaskModal
