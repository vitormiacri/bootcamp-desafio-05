import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { FaRedo } from 'react-icons/fa';

import api from '../../services/api';

import { Loading, Owner, IssueList, StateFilter, Pagination } from './styles';
import Container from '../../components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { state: 'all', label: 'Todas', active: true },
      { state: 'open', label: 'Abertas', active: false },
      { state: 'closed', label: 'Fechadas', active: false },
    ],
    filterIndex: 0,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(filter => filter.active).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { filterIndex, page, filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const reponse = await api.get(`/repos/${repoName}/issues`, {
      params: {
        page,
        per_page: 5,
        state: filters[filterIndex].state,
      },
    });

    this.setState({ issues: reponse.data });
  };

  handleStateClick = async filterIndex => {
    await this.setState({ filterIndex });
    this.loadIssues();
  };

  handlePagination = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'back' ? page - 1 : page + 1,
    });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      filterIndex,
      page,
    } = this.state;

    if (loading) {
      return (
        <Loading>
          <FaRedo color="#FFF" size={130} />
          <p>Carregando...</p>
        </Loading>
      );
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <StateFilter active={filterIndex}>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter.label}
                onClick={() => this.handleStateClick(index)}
              >
                {filter.label}
              </button>
            ))}
          </StateFilter>
          <Pagination loading={loading}>
            <button
              type="button"
              disabled={page < 2}
              onClick={() => this.handlePagination('back')}
            >
              Anterior
            </button>
            <span>{page}</span>
            <button type="button" onClick={() => this.handlePagination('next')}>
              Próxima
            </button>
          </Pagination>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
